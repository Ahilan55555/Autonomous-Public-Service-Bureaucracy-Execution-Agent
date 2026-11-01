import os
import json

from browser_agent.agent import BrowserAgent


URL = (
    "https://127.0.0.1:8000/"
    "tests/fixtures/browser_observation.html"
)

TASK = (
    "On the current test portal, locate and click the "
    "button named Continue. Do not fill any form fields. "
    "Do not submit any application or enter personal information."
)


def main():
    if not os.getenv("GEMINI_API_KEY"):
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    agent = BrowserAgent(
        allowed_domains=["127.0.0.1"],
        allow_local_test_server=True
    )

    # Only for the local self-signed HTTPS test certificate.
    agent.observer.ignore_https_errors = True

    try:
        print("\n[1] Starting browser...")
        agent.start()

        print("\n[2] Opening local test portal...")
        agent.navigate(URL)

        print("\n[3] Asking Gemini to perform the task...")
        result = agent.run_step(TASK)

        print("\nAgent result:")
        print(json.dumps(result, indent=2, default=str))

        if result.get("task_status") != "awaiting_user":
            print("\nNo approval-gated action was produced.")
            print("Inspect the result before continuing.")
            return

        if agent.pending_action is None:
            print("\nThe agent requested interaction, but there is")
            print("no pending browser action available to approve.")
            return

        action = agent.pending_action

        print("\n[4] Approval required")
        print("Proposed action:", action["action"])
        print("Target:", action["target"])

        print("\nInspect the browser before approving.")

        approval = input(
            "\nApprove this action? Type YES to continue: "
        ).strip()

        if approval.strip().upper() == "YES":
            print("\n[5] Executing approved action...")
            approval_result = agent.approve_pending_action()

            print("\nApproval result:")
            print(
                json.dumps(
                    approval_result,
                    indent=2,
                    default=str
                )
            )

            print("\n[6] Workflow finished.")

        else:
            print("\nRejecting action...")
            print(agent.reject_pending_action())

    except Exception as error:
        print("\nDemo failed:", str(error))
        raise


if __name__ == "__main__":
    main()