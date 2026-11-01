import json
import os

from google import genai

from browser_agent.integration.service_request import ServiceRequestAdapter
from browser_agent.integration.field_mapper import (
    build_mapping_prompt,
    validate_mapping,
)
from browser_agent.perception.observer import BrowserObserver
from browser_agent.security.data_classifier import classify_field
from browser_agent.security.sanitizer import (
    sanitize_observation,
    sanitize_text,
)
from browser_agent.security.outbound_policy import build_outbound_payload


REQUEST_FILE = "data/service_request_test.json"
PORTAL_URL = "https://parivahan.gov.in"
ALLOWED_DOMAINS = ["parivahan.gov.in"]
MODEL = "gemini-flash-lite-latest"


def main():
    if not os.getenv("GEMINI_API_KEY"):
        raise RuntimeError("GEMINI_API_KEY is not configured")

    print("\n[1] Loading service request...")

    with open(REQUEST_FILE, encoding="utf-8") as file:
        request = json.load(file)

    adapter = ServiceRequestAdapter(
        allowed_domains=ALLOWED_DOMAINS
    )

    safe_request = adapter.load(request)

    print("[2] Service request validated.")
    print("Service:", safe_request["service_name"])

    observer = BrowserObserver(
        allowed_domains=ALLOWED_DOMAINS
    )

    try:
        print("\n[3] Starting browser...")
        page = observer.start()

        print("[4] Opening Parivahan...")
        navigation = observer.navigate(PORTAL_URL)
        print("Navigation:", navigation)

        page.wait_for_timeout(3000)

        print("\n[5] Extracting webpage...")
        raw_observation = observer.observe()

        print("\n[6] Sanitizing webpage...")
        sanitized = sanitize_observation(raw_observation)

        outbound = build_outbound_payload(sanitized)

        # Only labels belonging to fields already approved by
        # the sanitizer and outbound policy are considered.
        visible_refs = {
            field["field_ref"]
            for field in outbound["input_fields"]
        }

        field_labels = []

        for field in raw_observation.get("input_fields", []):
            field_ref = field.get("field_ref")

            if field_ref not in visible_refs:
                continue

            if classify_field(field) not in {"PUBLIC", "PERSONAL"}:
                continue

            label = (
                field.get("label")
                or field.get("placeholder")
                or field.get("name")
                or field.get("id")
                or ""
            )

            field_labels.append({
                "field_ref": field_ref,
                "label": sanitize_text(label),
                "type": sanitize_text(
                    field.get("type", "text")
                ),
                "required": bool(field.get("required", False)),
                "disabled": bool(field.get("disabled", False)),
            })

        print("Privacy validation passed.")
        print("Visible field references:", len(visible_refs))
        print("Safe field labels:", len(field_labels))

        print("\n[7] Building Gemini prompt...")

        prompt = build_mapping_prompt(
            safe_request,
            outbound,
            field_labels,
        )

        print("\n[8] Requesting Gemini mapping...")

        client = genai.Client(
            api_key=os.environ["GEMINI_API_KEY"]
        )

        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config={
                "temperature": 0,
                "response_mime_type": "application/json",
            },
        )

        if not response.text:
            raise RuntimeError("Gemini returned an empty response")

        proposal = json.loads(response.text)

        print("\n[9] Validating mapping...")

        validated = validate_mapping(
            proposal,
            safe_request["form_field_names"],
            visible_refs,
        )

        print("\n========== MAPPING REPORT ==========")
        print("Service:", safe_request["service_name"])
        print("Mappings:", len(validated))

        print(json.dumps(validated, indent=2))

        print("\nApplicant values sent to Gemini: NO")
        print("Documents uploaded: NO")
        print("Application submitted: NO")

        if not validated:
            print("\nNo reliable mappings found.")
            print("Navigate to the actual application form first.")
        else:
            print("\nMapping proposal successfully validated.")
            print("All proposed mappings require human approval.")

    finally:
        observer.close()


if __name__ == "__main__":
    main()
