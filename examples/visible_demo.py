import sys
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from browser_agent.perception.observer import BrowserObserver
from browser_agent.execution.executor import BrowserExecutor
from browser_agent.execution.value_provider import LocalValueProvider
from browser_agent.execution.field_matcher import match_fields


def load_service():
    path = ROOT / "data" / "service_request.json"

    with open(path, "r", encoding="utf-8") as file:
        service = json.load(file)

    if not isinstance(service, dict):
        raise ValueError("Invalid service request")

    if not isinstance(service.get("form_payload"), dict):
        raise ValueError("Missing form payload")

    if service.get("missing_form_fields"):
        raise ValueError("Service has missing required form fields")

    return service


def main():

    observer = BrowserObserver(
        allowed_domains=["example.com"]
    )

    try:
        # 1. Load service data.
        service = load_service()
        form_data = service["form_payload"]

        print("\nService:", service["service_name"])
        print("Loading", len(form_data), "local fields...")

        # 2. Launch browser.
        page = observer.start()
        observer.navigate("https://example.com")

        # 3. Create controlled demonstration form.
        page.set_content("""
        <!DOCTYPE html>
        <html>
        <body>
            <h1>Duplicate RC Application</h1>

            <form>
                <label for="full_name">Full Name</label>
                <input id="full_name" name="full_name" type="text">

                <label for="email">Email Address</label>
                <input id="email" name="email" type="email">

                <label for="registration_number">Registration Number</label>
                <input id="registration_number" name="registration_number" type="text">

                <label for="chassis_number">Chassis Number</label>
                <input id="chassis_number" name="chassis_number" type="text">

                <label for="engine_number">Engine Number</label>
                <input id="engine_number" name="engine_number" type="text">

                <label for="mobile_number">Mobile Number</label>
                <input id="mobile_number" name="mobile_number" type="tel">

                <label for="state">State</label>
                <input id="state" name="state" type="text">

                <label for="district">District</label>
                <input id="district" name="district" type="text">

                <label for="reason_for_duplicate">Reason for Duplicate</label>
                <input id="reason_for_duplicate" name="reason_for_duplicate" type="text">

                <label for="grievance_description">Grievance Description</label>
                <textarea id="grievance_description" name="grievance_description"></textarea>

                <button type="submit">Submit Application</button>
            </form>
        </body>
        </html>
        """)

        # 4. Observe browser.
        observation = observer.observe()

        # 5. Match browser fields with local references.
        matches = match_fields(
            observation,
            set(form_data.keys())
        )

        print("\nProposed field mappings:")

        for match in matches:
            print(
                match["field_ref"],
                "<--",
                match["value_ref"]
            )

        if not matches:
            print("No matching fields found.")
            return

        unmatched = set(form_data.keys()) - {
            match["value_ref"] for match in matches
        }

        print("\nMatched fields:", len(matches))
        print("Unmatched fields:", len(unmatched))

        # 6. Show mappings and request approval.
        approval = input(
            "\nApprove filling these fields? (yes/no): "
        ).strip().lower()

        if approval != "yes":
            print("Operation cancelled.")
            return

        # 7. Create local provider.
        provider = LocalValueProvider.from_service_payload(
            service,
            approved_references={
                match["value_ref"] for match in matches
            }
        )

        # 8. Configure executor.
        executor = BrowserExecutor(
            page=page,
            allowed_domains=["example.com"],
            value_provider=provider
        )

        executor.register_observation(observation)

        # 9. Execute each approved field.
        results = []

        for match in matches:

            action = {
                "action": "fill",
                "target": match["field_ref"],
                "parameters": {
                    "value_ref": match["value_ref"]
                },
                "reason": "Fill approved service form field"
            }

            try:
                result = executor.execute(
                    action,
                    user_approved=True
                )

                results.append({
                    "field_ref": match["field_ref"],
                    "value_ref": match["value_ref"],
                    "success": (
                        result.get("status") == "executed"
                        and result.get("verified") is True
                    )
                })

            except Exception:
                results.append({
                    "field_ref": match["field_ref"],
                    "value_ref": match["value_ref"],
                    "success": False
                })

        # 10. Report results without exposing actual values.
        print("\nExecution results:")

        for result in results:
            print({
                "field_ref": result["field_ref"],
                "value_ref": result["value_ref"],
                "success": result["success"]
            })

        successful = sum(
            result["success"] for result in results
        )

        print(
            f"\nVerified fields: {successful}/{len(matches)}"
        )

        if successful == len(matches):
            print("SUCCESS: All matched fields were filled and verified.")
        else:
            print("PARTIAL SUCCESS: Some fields need investigation.")

        print("\nSubmission was NOT performed.")

        input("\nPress ENTER to close Chromium...")

    except Exception as error:
        print("\nDemo failed:", str(error))

    finally:
        observer.close()


if __name__ == "__main__":
    main()