import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault("BROWSER_HEADLESS", "true")

from browser_agent.agent import BrowserAgent

MOCK_VAHAN_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>VAHAN Mock Portal</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        #app { max-width: 700px; margin: 0 auto; }
        .card { border: 1px solid #ccc; padding: 20px; border-radius: 10px; }
        button { padding: 10px 16px; margin-top: 10px; }
        input { width: 100%; max-width: 300px; display: block; margin-top: 8px; margin-bottom: 12px; padding: 8px; }
    </style>
</head>
<body>
    <main id="app" class="card">
        <h1>VAHAN Citizen Services</h1>
        <h2>Vehicle Registration Lookup</h2>
        <input type="text" id="registration" name="registration" aria-label="Registration number" value="TN-45-AZ-1234">
        <button onclick="showVehicleDetails()">Validate registration</button>
    </main>

    <script>
        function showVehicleDetails() {
            document.getElementById("app").innerHTML = `
                <div class="card">
                    <h1>Vehicle Details</h1>
                    <p>Registration: TN-45-AZ-1234</p>
                    <p>Owner: Rahul Sharma</p>
                    <p>Vehicle: Car</p>
                    <button onclick="showChassisVerification()">Continue to chassis verification</button>
                </div>
            `;
        }

        function showChassisVerification() {
            document.getElementById("app").innerHTML = `
                <div class="card">
                    <h1>Chassis Verification</h1>
                    <p>Enter the last five digits of the chassis number.</p>
                    <input type="text" id="chassis" name="chassis" aria-label="Chassis digits" value="12345">
                    <button onclick="showOtpVerification()">Verify chassis</button>
                </div>
            `;
        }

        function showOtpVerification() {
            document.getElementById("app").innerHTML = `
                <div class="card">
                    <h1>OTP Verification</h1>
                    <p>OTP verification is required.</p>
                    <input type="password" id="otp" name="otp" autocomplete="one-time-code" aria-label="OTP">
                    <p>Human intervention required.</p>
                </div>
            `;
        }
    </script>
</body>
</html>
"""


class FakeDecisionEngine:
    def __init__(self, model=None):
        self.model = model

    def decide(self, task, observation):
        buttons = [
            button.get("text", "")
            for button in observation.get("buttons", [])
        ]

        title = observation.get("title", "")
        headings = " ".join(observation.get("headings", []))
        text = f"{title} {headings} {' '.join(buttons)}".lower()

        if "validate registration" in text:
            return {
                "action": "click",
                "target": "Validate registration",
                "parameters": {},
                "reason": "Validate registration number",
            }

        if "continue to chassis verification" in text:
            return {
                "action": "click",
                "target": "Continue to chassis verification",
                "parameters": {},
                "reason": "Continue the duplicate RC workflow",
            }

        if "verify chassis" in text:
            return {
                "action": "click",
                "target": "Verify chassis",
                "parameters": {},
                "reason": "Verify the chassis digits",
            }

        if "otp verification" in text:
            return {
                "action": "request_user_input",
                "target": "Enter OTP manually",
                "parameters": {},
                "reason": "OTP verification requires human interaction",
            }

        return {
            "action": "stop",
            "target": "",
            "parameters": {},
            "reason": "No safe action available",
        }


def ensure_demo_dirs():
    output_dir = PROJECT_ROOT / "demo_output"
    output_dir.mkdir(exist_ok=True)
    return output_dir


def take_screenshot(page, label, output_dir):
    path = output_dir / f"{label}.png"
    page.screenshot(path=str(path), full_page=True)
    print(f"[SCREENSHOT] {path}")


def main():
    browser_agent_module = __import__("browser_agent.agent", fromlist=["BrowserAgent"])
    browser_agent_module.DecisionEngine = FakeDecisionEngine

    output_dir = ensure_demo_dirs()

    agent = BrowserAgent(
        allowed_domains=["example.com"],
        model="fake-model",
    )

    try:
        print("\n[1] Starting browser...")
        agent.start()
        print("[2] Navigating to mock portal...")
        agent.navigate("https://example.com")
        agent.observer.page.set_content(MOCK_VAHAN_HTML)
        take_screenshot(agent.observer.page, "01_initial_page", output_dir)

        for step in range(1, 5):
            print(f"\n[STEP {step}] Running agent decision...")
            result = agent.run_step("Complete the duplicate RC workflow")
            print(result)

            if result.get("task_status") == "awaiting_user":
                print("[INFO] Action requires human approval or manual intervention.")
                if agent.pending_action is not None:
                    print("[3] Approving pending action...")
                    approval = agent.approve_pending_action()
                    print(approval)
                    take_screenshot(agent.observer.page, f"0{step}_after_approval", output_dir)
                else:
                    print("[INFO] Human step required: OTP / authentication.")
                    take_screenshot(agent.observer.page, f"0{step}_manual_step", output_dir)
                    break

            if result.get("action") == "stop":
                print("[INFO] Stop action reached.")
                break

        print("\n[4] Demo completed.")
        print("[INFO] For a visible browser recording, run with BROWSER_HEADLESS=false")
        print("[INFO] Example: $env:BROWSER_HEADLESS='false'; python examples/working_hackathon_demo.py")

    finally:
        agent.close()
        print("[INFO] Browser closed.")


if __name__ == "__main__":
    main()
