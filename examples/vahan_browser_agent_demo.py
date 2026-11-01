import os
import sys
import json
import getpass
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from browser_agent.agent import BrowserAgent


VAHAN_URL = "https://vahan.parivahan.gov.in/vahanservice/vahan/"

ALLOWED_DOMAINS = [
    "parivahan.gov.in",
    "vahan.parivahan.gov.in",
]

def close_mobile_popup(page):
    """Close VAHAN's mobile update popup if visible."""

    modal = page.locator("#updatemobileno")

    try:
        modal.wait_for(state="visible", timeout=5000)

        print("[INFO] Mobile update popup detected.")

        modal.get_by_role(
            "button",
            name="Close",
            exact=True
        ).click(timeout=10000)

        modal.wait_for(state="hidden", timeout=15000)

        print("[OK] Mobile popup closed.")

    except Exception as error:
        if modal.is_visible():
            raise RuntimeError(
                f"Could not close mobile popup: {error}"
            ) from error

        print("[INFO] No visible mobile popup.")

def display_observation(agent):
    """Display a sanitized webpage observation."""

    observation = agent.observer.observe()

    from browser_agent.security.sanitizer import (
        sanitize_observation
    )

    safe_observation = sanitize_observation(observation)

    print("\n========== SANITIZED VAHAN OBSERVATION ==========")
    print(json.dumps(safe_observation, indent=2))

    return safe_observation


def main():

    if not os.getenv("GEMINI_API_KEY"):
        print("[ERROR] GEMINI_API_KEY is not configured.")
        return

    agent = BrowserAgent(
        allowed_domains=ALLOWED_DOMAINS,
        model="gemini-flash-lite-latest",
    )

    try:
        print("\n========================================")
        print("       VAHAN BROWSER AGENT DEMO")
        print("========================================")

        # 1. Start browser
        print("\n[1] Starting Chromium...")
        agent.start()

        # 2. Open VAHAN
        print("[2] Opening VAHAN portal...")
        navigation = agent.navigate(VAHAN_URL)

        print("Navigation:", navigation)

        page = agent.observer.page

        page.wait_for_load_state(
            "domcontentloaded",
            timeout=30000
        )

        page.wait_for_timeout(3000)

        # Handle the portal popup before observing the page.
        close_mobile_popup(page)

        print("\nPortal title:", page.title())
        print("Portal URL:", page.url)

        # 3. Display sanitized observation
        display_observation(agent)

        # 4. Ask Gemini to understand the page
        print("\n[3] Asking Gemini to identify the Duplicate RC service...")

        task = (
            "Inspect the current government portal webpage. "
            "Identify whether this page provides access to vehicle "
            "services or Duplicate Registration Certificate services. "
            "If a clearly relevant visible button or link exists, "
            "propose exactly one safe navigation click. "
            "Do not enter private information, fill forms, submit "
            "applications, make payments, or perform authentication. "
            "If no suitable action is visible, use the stop action."
        )

        result = agent.run_step(task)

        print("\n========== GEMINI DECISION ==========")
        print(json.dumps(result, indent=2, default=str))

        # 5. Human approval
        if result.get("task_status") == "awaiting_user":

            action = agent.pending_action

            print("\n========== ACTION REVIEW ==========")
            print("Action:", action["action"])
            print("Target:", action["target"])
            print("Reason:", action["reason"])

            approval = input(
                "\nDo you approve this browser action? (yes/no): "
            ).strip().lower()

            if approval == "yes":

                print("\n[4] Executing approved action...")

                execution = agent.approve_pending_action()

                print("\n========== EXECUTION RESULT ==========")
                print(json.dumps(
                    execution,
                    indent=2,
                    default=str
                ))

                if execution.get("verification"):
                    print("\n========== VERIFICATION ==========")
                    print(json.dumps(
                        execution["verification"],
                        indent=2,
                        default=str
                    ))

            else:
                print("\n[STOP] Action rejected.")
                agent.reject_pending_action()

        elif result.get("action") == "stop":
            print("\n[INFO] Gemini determined that no safe action is available.")

        else:
            print("\n[INFO] No approved action was executed.")
            print("Task status:", result.get("task_status"))

        # 6. Show final page state
        print("\n========== FINAL BROWSER STATE ==========")
        print("URL:", page.url)
        print("Title:", page.title())

        input("\nPress ENTER to close the browser...")

    except KeyboardInterrupt:
        print("\n[STOP] Demo interrupted.")

    except Exception as error:
        print(f"\n[ERROR] {type(error).__name__}: {error}")

    finally:
        agent.close()
        print("\n[INFO] Browser closed.")


if __name__ == "__main__":
    main()