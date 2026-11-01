import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault("BROWSER_HEADLESS", "false")

from browser_agent import agent as browser_agent_module
from browser_agent.agent import BrowserAgent

MOCK_VAHAN_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>VAHAN Mock Portal</title>
    <style>
        :root {
            --bg: #f4f7fb;
            --card: #ffffff;
            --primary: #0d6efd;
            --text: #1b1b1b;
            --muted: #5b6472;
            --border: #dbe2ea;
            --success: #1f9d55;
            --warning: #d97706;
        }
        body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #eef4ff, #f7fafc);
            color: var(--text);
        }
        .shell {
            max-width: 960px;
            margin: 30px auto;
            padding: 24px;
        }
        .topbar {
            background: #0a2b5d;
            color: white;
            padding: 16px 20px;
            border-radius: 10px 10px 0 0;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        .card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 0 0 10px 10px;
            padding: 26px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.06);
        }
        h1 { margin-top: 0; }
        h2 { color: var(--muted); }
        .badge {
            display: inline-block;
            background: #eaf7ef;
            color: var(--success);
            border-radius: 999px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 12px;
        }
        label { display: block; font-weight: bold; margin-bottom: 10px; }
        input {
            width: 100%; max-width: 420px;
            font-size: 16px;
            padding: 12px 14px;
            border: 1px solid var(--border);
            border-radius: 8px;
            margin: 8px 0 14px;
        }
        button {
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 18px;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
        }
        .warning {
            background: #fff7e6;
            color: var(--warning);
            border: 1px solid #f8d59e;
            border-radius: 8px;
            padding: 12px 14px;
            margin-top: 14px;
        }
    </style>
</head>
<body>
    <div class="shell">
        <div class="topbar">PUBLIC SERVICE AUTOMATION DEMO</div>
        <div id="app" class="card">
            <div class="badge">Duplicate RC Workflow</div>
            <h1>VAHAN Citizen Services</h1>
            <h2>Vehicle Registration Lookup</h2>
            <label>Registration Number</label>
            <input type="text" id="registration" name="registration" aria-label="Registration number" value="TN-45-AZ-1234">
            <button onclick="showVehicleDetails()">Validate registration</button>
        </div>
    </div>

    <script>
        function showVehicleDetails() {
            document.getElementById("app").innerHTML = `
                <div class="badge">Step 2 of 3</div>
                <h1>Vehicle Details</h1>
                <p><strong>Registration:</strong> TN-45-AZ-1234</p>
                <p><strong>Owner:</strong> Rahul Sharma</p>
                <p><strong>Vehicle:</strong> Car</p>
                <button onclick="showChassisVerification()">Continue to chassis verification</button>
            `;
        }

        function showChassisVerification() {
            document.getElementById("app").innerHTML = `
                <div class="badge">Step 3 of 3</div>
                <h1>Chassis Verification</h1>
                <p>Enter the last five digits of the chassis number.</p>
                <label>Chassis Digits</label>
                <input type="text" id="chassis" name="chassis" aria-label="Chassis digits" value="12345">
                <button onclick="showOtpVerification()">Verify chassis</button>
            `;
        }

        function showOtpVerification() {
            document.getElementById("app").innerHTML = `
                <div class="badge">Security Gate</div>
                <h1>OTP Verification</h1>
                <p>OTP verification is required for final confirmation.</p>
                <label>OTP</label>
                <input type="password" id="otp" name="otp" autocomplete="one-time-code" aria-label="OTP">
                <div class="warning">Human intervention required. Password and OTP must never be automated.</div>
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
        text = " ".join([
            observation.get("title", ""),
            *observation.get("headings", []),
            *[button.get("text", "") for button in observation.get("buttons", [])]
        ]).lower()

        if "validate registration" in text:
            return {
                "action": "click",
                "target": "Validate registration",
                "parameters": {},
                "reason": "Validate registration number before the duplicate RC flow continues.",
            }

        if "continue to chassis verification" in text:
            return {
                "action": "click",
                "target": "Continue to chassis verification",
                "parameters": {},
                "reason": "Proceed to the next verification step in the duplicate RC workflow.",
            }

        if "verify chassis" in text:
            return {
                "action": "click",
                "target": "Verify chassis",
                "parameters": {},
                "reason": "Confirm the chassis digits to continue the workflow.",
            }

        if "otp verification" in text:
            return {
                "action": "request_user_input",
                "target": "Enter OTP manually",
                "parameters": {},
                "reason": "Authentication is sensitive and must be handled by the human user.",
            }

        return {
            "action": "stop",
            "target": "",
            "parameters": {},
            "reason": "No safe browser action is available in the current state.",
        }


def main():
    browser_agent_module.DecisionEngine = FakeDecisionEngine

    agent = BrowserAgent(
        allowed_domains=["example.com"],
        model="fake-model"
    )

    try:
        print("\n[Demo] Starting browser in visible mode...")
        agent.start()
        agent.navigate("https://example.com")
        agent.observer.page.set_content(MOCK_VAHAN_HTML)

        print("[Demo] Step 1: Validate registration")
        result = agent.run_step("Complete the duplicate RC workflow")
        print(result)
        if result.get("task_status") == "awaiting_user":
            agent.approve_pending_action()

        print("[Demo] Step 2: Continue to chassis verification")
        result = agent.run_step("Complete the duplicate RC workflow")
        print(result)
        if result.get("task_status") == "awaiting_user":
            agent.approve_pending_action()

        print("[Demo] Step 3: Verify chassis")
        result = agent.run_step("Complete the duplicate RC workflow")
        print(result)
        if result.get("task_status") == "awaiting_user":
            agent.approve_pending_action()

        print("[Demo] Security checkpoint reached: OTP authentication requires human input.")
        result = agent.run_step("Complete the duplicate RC workflow")
        print(result)

        print("\n[Demo] The browser is now paused for manual OTP entry as required by the security policy.")
        input("Press Enter to close the browser...")

    finally:
        agent.close()
        print("[Demo] Browser closed.")


if __name__ == "__main__":
    main()
