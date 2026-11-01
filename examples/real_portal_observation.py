import json
from pathlib import Path
from datetime import datetime, timezone

from browser_agent.perception.observer import BrowserObserver

from browser_agent.security.data_classifier import (
    classify_field
)

from browser_agent.security.sanitizer import (
    sanitize_observation
)

from browser_agent.security.outbound_policy import (
    build_outbound_payload
)


TARGET_URL = "https://parivahan.gov.in"

ALLOWED_DOMAINS = [
    "parivahan.gov.in"
]

OUTPUT_DIR = Path("data/real_portal_tests")


def main():

    observer = BrowserObserver(
        allowed_domains=ALLOWED_DOMAINS
    )

    try:

        print("\nStarting real government portal observation...")

        page = observer.start()

        print("Navigating to:", TARGET_URL)

        navigation_result = observer.navigate(
            TARGET_URL
        )

        print("\nNavigation result:")
        print(navigation_result)

        # Allow dynamic page content to render.
        page.wait_for_timeout(3000)

        print("\nExtracting DOM...")

        observation = observer.observe()

        print("DOM extraction successful.")

        # Classify fields locally.
        classifications = [
            classify_field(field)
            for field in observation.get("input_fields", [])
        ]

        print("\nField classification summary:")

        for category in [
            "PUBLIC",
            "PERSONAL",
            "CONFIDENTIAL",
            "NEVER_SEND"
        ]:
            print(
                f"{category}: "
                f"{classifications.count(category)}"
            )

        print("\nSanitizing observation...")

        sanitized = sanitize_observation(
            observation
        )

        print("Sanitization completed.")

        print("\nValidating outbound payload...")

        outbound = build_outbound_payload(
            sanitized
        )

        print("Outbound policy validation passed.")

        # Save only sanitized data.
        OUTPUT_DIR.mkdir(
            parents=True,
            exist_ok=True
        )

        report = {
            "timestamp": datetime.now(
                timezone.utc
            ).isoformat(),

            "target": TARGET_URL,

            "final_url": page.url,

            "navigation_status": navigation_result[
                "status"
            ],

            "dom_summary": {
                "headings": len(
                    observation.get("headings", [])
                ),

                "buttons": len(
                    observation.get("buttons", [])
                ),

                "links": len(
                    observation.get("links", [])
                ),

                "input_fields": len(
                    observation.get("input_fields", [])
                )
            },

            "classification_summary": {
                category: classifications.count(category)
                for category in [
                    "PUBLIC",
                    "PERSONAL",
                    "CONFIDENTIAL",
                    "NEVER_SEND"
                ]
            },

            "blocked_navigation_attempts": len(
                observer.blocked_navigation_attempts
            ),

            "privacy_validation": "PASSED",

            "sanitized_observation": outbound
        }

        output_file = (
            OUTPUT_DIR / "latest_report.json"
        )

        output_file.write_text(
            json.dumps(
                report,
                indent=4
            ),
            encoding="utf-8"
        )

        print("\n========== TEST REPORT ==========")

        print("Final URL:", page.url)

        print(
            "Headings:",
            report["dom_summary"]["headings"]
        )

        print(
            "Buttons:",
            report["dom_summary"]["buttons"]
        )

        print(
            "Links:",
            report["dom_summary"]["links"]
        )

        print(
            "Input fields:",
            report["dom_summary"]["input_fields"]
        )

        print(
            "Blocked navigations:",
            report["blocked_navigation_attempts"]
        )

        print("Privacy validation: PASSED")

        print("\nReport saved to:", output_file)

        print("\nNo Gemini request was made.")
        print("No forms were filled.")
        print("No application was submitted.")
        input("\nPress ENTER to close Chromium...")

    except Exception as error:

        print("\nOBSERVATION FAILED")

        print("Error type:", type(error).__name__)

        print("Error:", str(error))

    finally:

        observer.close()


if __name__ == "__main__":
    main()