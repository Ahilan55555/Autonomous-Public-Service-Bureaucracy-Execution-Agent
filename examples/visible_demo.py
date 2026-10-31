import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from browser_agent.perception.observer import BrowserObserver
from browser_agent.execution.executor import BrowserExecutor
from browser_agent.execution.value_provider import LocalValueProvider
from browser_agent.intelligence.decision_engine import DecisionEngine


def main():
    observer = BrowserObserver(
        allowed_domains=["example.com"]
    )

    try:
        print("\nStarting Chromium...")
        page = observer.start()

        observer.navigate("https://example.com")

        # Local demo form. No real personal information.
        page.set_content("""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Public Service Application Demo</title>
        </head>
        <body>
            <h1>Public Service Application</h1>

            <form>
                <label for="name">Applicant Name</label>
                <input id="name" type="text">

                <label for="email">Email</label>
                <input id="email" type="email">

                <label for="password">Password</label>
                <input id="password" type="password">
            </form>
        </body>
        </html>
        """)

        # 1. Observe browser state.
        print("\nObserving webpage...")
        observation = observer.observe()

        for field in observation["input_fields"]:
            print({
                "field_ref": field["field_ref"],
                "type": field["type"]
            })

        # 2. Ask Gemini to propose an action.
        print("\nSending sanitized observation to Gemini...")

        decision_engine = DecisionEngine()

        task = (
            "Fill field_0001 using the applicant_name value reference. "
            "Do not interact with any other field. "
            "Return a valid fill action."
        )

        action = decision_engine.decide(
            task=task,
            observation=observation
        )

        # 3. Apply strict demo-specific action restrictions.
        if (
            action["action"] != "fill"
            or action["target"] != "field_0001"
            or action["parameters"].get("value_ref") != "applicant_name"
        ):
            print("\nGemini proposed an action outside demo permissions.")
            print("Action rejected.")
            return

        print("\nGemini proposed:")
        print({
            "action": action["action"],
            "target": action["target"],
            "value_ref": action["parameters"]["value_ref"]
        })

        # 4. Wait for explicit user approval.
        approval = input(
            "\nApprove this exact operation? (yes/no): "
        ).strip().lower()

        if approval != "yes":
            print("Operation cancelled.")
            return

        # 5. Configure local values only after approval.
        provider = LocalValueProvider(
            values={
                "applicant_name": "Demo Applicant"
            },
            approved_references={"applicant_name"}
        )

        executor = BrowserExecutor(
            page=page,
            allowed_domains=["example.com"],
            value_provider=provider
        )

        executor.register_observation(observation)

        # 6. Execute through the authorization layer.
        result = executor.execute(
            action,
            user_approved=True
        )

        print("\nExecution result:")
        print(result)

        # 7. Verify locally. Never send the actual value to Gemini.
        verified = (
            result.get("status") == "executed"
            and page.locator("#name").input_value()
            == "Demo Applicant"
        )

        print("\nVerification:")
        print("Field filled correctly:", verified)

        input("\nPress ENTER to close Chromium...")

    except Exception as error:
        print("\nDemo failed:", str(error))

    finally:
        observer.close()


if __name__ == "__main__":
    main()