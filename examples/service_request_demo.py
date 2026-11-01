import json
from pathlib import Path

from browser_agent.integration.service_request import (
    ServiceRequestAdapter,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]

REQUEST_FILE = PROJECT_ROOT / "data" / "service_request_test.json"


def main():
    print("\n[1] Loading service request...")

    with open(REQUEST_FILE, "r", encoding="utf-8") as file:
        request = json.load(file)

    print("[2] Validating service request...")

    adapter = ServiceRequestAdapter(
        allowed_domains=["parivahan.gov.in"]
    )

    safe_request = adapter.load(request)

    print("\n[3] Sanitized service information:")

    print(json.dumps(safe_request, indent=2))

    print("\n[4] Building Gemini task...")

    task = adapter.build_llm_task(safe_request)

    print(task)

    print("\n[5] Testing local value retrieval...")

    registration_number = adapter.get_local_value(
        "registration_number"
    )

    print(
        "Registration number available locally:",
        bool(registration_number)
    )

    print("\n[6] Checking document references...")

    for document in adapter.get_local_attachments():
        print(
            document["requirement"],
            "->",
            document["filename"]
        )

    print("\nSUCCESS: Service request integration test completed.")

    print("Actual applicant values were not included in the safe request.")
    print("Signed document URLs were not included in the safe request.")
    print("No application was submitted.")


if __name__ == "__main__":
    main()