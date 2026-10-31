import unittest
from unittest.mock import patch

from browser_agent.agent import BrowserAgent


class AgentIntegrationTests(unittest.TestCase):

    @patch("browser_agent.agent.DecisionEngine")
    def test_agent_observe_decide_execute(self, mock_engine):

        mock_engine.return_value.decide.return_value = {
            "action": "click",
            "target": "Continue",
            "parameters": {},
            "reason": "Continue the test workflow",
        }

        agent = BrowserAgent(
            allowed_domains=["example.com"]
        )

        try:
            agent.start()

            # Navigate to an allowlisted domain.
            agent.navigate("https://example.com")

            # Replace the page content with a controlled test page.
            agent.observer.page.set_content("""
                <!DOCTYPE html>
                <html>
                    <body>
                        <h1>Application Test</h1>
                        <button onclick="
                            this.textContent = 'Completed';
                        ">
                            Continue
                        </button>
                    </body>
                </html>
            """)

            result = agent.run_step(
                "Click the Continue button"
            )

            self.assertEqual(result["action"], "click")
            self.assertEqual(result["result"]["status"], "executed")

            # Verify the actual browser state.
            button_text = agent.observer.page.get_by_role(
                "button",
                name="Completed"
            ).inner_text()

            self.assertEqual(button_text, "Completed")

        finally:
            agent.close()


if __name__ == "__main__":
    unittest.main()