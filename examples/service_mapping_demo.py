import json
import os

from google import genai

from browser_agent.integration.service_request import ServiceRequestAdapter
from browser_agent.integration.field_mapper import (
    build_mapping_prompt,
    validate_mapping,
)
from browser_agent.perception.observer import BrowserObserver
from browser_agent.security.sanitizer import sanitize_observation
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

    print("\n[3] Starting browser...")

    observer = BrowserObserver(
        allowed_domains=ALLOWED_DOMAINS
    )

    try:
        page = observer.start()

        print("[4] Opening Parivahan...")
        result = observer.navigate(PORTAL_URL)
        print("Navigation:", result)

        page.wait_for_timeout(3000)

        print("\n[5] Extracting webpage structure...")
        raw_observation = observer.observe()

        print("DOM extraction completed.")

        print("\n[6] Sanitizing webpage information...")
        sanitized = sanitize_observation(raw_observation)

        # Strict outbound policy validation.
        outbound = build_outbound_payload(sanitized)

        print("Privacy validation passed.")

        visible_fields = [
            field["field_ref"]
            for field in outbound["input_fields"]
        ]

        print("Visible safe field references:", len(visible_fields))

        print("\n[7] Building Gemini mapping request...")

        prompt = build_mapping_prompt(
            safe_request,
            outbound
        )

        print("\n[8] Requesting Gemini mapping proposal...")

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

        print("\nGemini proposal received.")

        print("\n[9] Validating proposal locally...")

        validated = validate_mapping(
            proposal,
            safe_request["form_field_names"],
            visible_fields,
        )

        print("\n========== MAPPING REPORT ==========")

        print("Service:", safe_request["service_name"])
        print("Proposed mappings:", len(validated))

        print(json.dumps(validated, indent=2))

        print("\nApplicant values sent to Gemini: NO")
        print("Document URLs sent to Gemini: NO")
        print("Form fields filled: NO")
        print("Documents uploaded: NO")
        print("Application submitted: NO")

        print("\nSUCCESS: Mapping demonstration completed.")

    finally:
        observer.close()


if __name__ == "__main__":
    main()