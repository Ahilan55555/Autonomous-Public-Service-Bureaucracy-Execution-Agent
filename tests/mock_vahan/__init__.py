import unittest
from unittest.mock import patch

from browser_agent.agent import BrowserAgent


MOCK_VAHAN_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>VAHAN Mock Portal</title>
</head>
<body>
    <main id="app">
        <h1>VAHAN Citizen Services</h1>
        <h2>Vehicle Registration Lookup</h2>

        <input
            type="text"
            id="registration"
            name="registration"
            value="MOCK-TN-0001"
            aria-label="Synthetic registration number"
        >

        <button onclick="showVehicleDetails()">
            Validate registration
        </button>
    </main>

    <script>
        function showVehicleDetails() {
            document.getElementById("app").innerHTML = `
                <h1>Vehicle Details</h1>
                <p>Registration: MOCK-TN-0001</p>
                <p>Owner: Synthetic Test User</p>
                <p>Vehicle: Mock Test Vehicle</p>

                <button onclick="showChassisVerification()">
                    Continue to chassis verification
                </button>
            `;
        }

        function showChassisVerification() {
            document.getElementById("app").innerHTML = `
                <h1>Chassis Verification</h1>

                <p>
                    Enter the last five digits of the chassis number.
                </p>

                <input
                    type="text"
                    id="chassis"
                    name="chassis"
                    value="12345"
                    aria-label="Synthetic chassis digits"
                >

                <button onclick="showOtpVerification()">
                    Verify chassis
                </button>
            `;
        }

        function showOtpVerification() {
            document.getElementById("app").innerHTML = `
                <h1>OTP Verification</h1>

                <p>
                    OTP verification is required.
                </p>

                <input
                    type="password"
                    id="otp"
                    name="otp"
                    autocomplete="one-time-code"
                    aria-label="OTP"
                >

                <p>
                    Human intervention required.
                </p>
            `;
        }
    </script>
</body>
</html>
"""


class MockDuplicateRCWorkflowTests(unittest.TestCase):

    @patch("browser_agent.agent.DecisionEngine")
    def test_duplicate_rc_workflow_stops_at_otp(self, mock_engine):

        actions = [
            {
                "action": "click",
                "target": "Validate registration",
                "parameters": {},
                "reason": "Validate synthetic vehicle registration",
            },
            {
                "action": "click",
                "target": "Continue to chassis verification",
                "parameters": {},
                "reason": "Continue to chassis verification",
            },
            {
                "action": "click",
                "target": "Verify chassis",
                "parameters": {},
                "reason": "Verify synthetic chassis digits",
            },
            {
                "action": "request_user_input",
                "target": "Enter OTP manually",
                "parameters": {},
                "reason": "OTP requires human input",
            },
        ]

        mock_engine.return_value.decide.side_effect = actions

        agent = BrowserAgent(
            allowed_domains=["example.com"]
        )

        try:
            # Start the real browser agent.
            agent.start()

            # Navigate to an allowlisted HTTPS origin.
            agent.navigate("https://example.com")

            # Load the synthetic VAHAN portal.
            agent.observer.page.set_content(MOCK_VAHAN_HTML)

            # STEP 1: Registration validation.
            result = agent.run_step(
                "Complete the synthetic Duplicate RC workflow"
            )

            self.assertEqual(
                result["task_status"],
                "awaiting_user"
            )

            self.assertEqual(
                result["result"]["reason"],
                "explicit_user_approval_required"
            )

            approval = agent.approve_pending_action()

            self.assertEqual(
                approval["status"],
                "executed"
            )

            self.assertEqual(
                approval["verification"]["status"],
                "success"
            )

            self.assertIn(
                "Vehicle Details",
                agent.observer.page.locator("body").inner_text()
            )

            # STEP 2: Continue to chassis verification.
            result = agent.run_step(
                "Complete the synthetic Duplicate RC workflow"
            )

            self.assertEqual(
                result["task_status"],
                "awaiting_user"
            )

            approval = agent.approve_pending_action()

            self.assertEqual(
                approval["status"],
                "executed"
            )

            self.assertIn(
                "Chassis Verification",
                agent.observer.page.locator("body").inner_text()
            )

            # STEP 3: Verify synthetic chassis digits.
            result = agent.run_step(
                "Complete the synthetic Duplicate RC workflow"
            )

            self.assertEqual(
                result["task_status"],
                "awaiting_user"
            )

            approval = agent.approve_pending_action()

            self.assertEqual(
                approval["status"],
                "executed"
            )

            self.assertIn(
                "OTP Verification",
                agent.observer.page.locator("body").inner_text()
            )

            # STEP 4: Agent must request human OTP input.
            result = agent.run_step(
                "Complete the synthetic Duplicate RC workflow"
            )

            self.assertEqual(
                result["action"],
                "request_user_input"
            )

            self.assertEqual(
                result["task_status"],
                "awaiting_user"
            )

            # No OTP is automatically entered or submitted.
            self.assertIsNone(agent.pending_action)

            print("\n[PASS] Synthetic Duplicate RC workflow")
            print("[PASS] Registration validation")
            print("[PASS] Chassis verification")
            print("[PASS] OTP boundary enforced")
            print("[PASS] Human intervention required")

        finally:
            agent.close()


if __name__ == "__main__":
    unittest.main()