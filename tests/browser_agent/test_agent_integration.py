import unittest
from unittest.mock import patch

from browser_agent.agent import BrowserAgent, BrowserAgentError


class AgentIntegrationTests(unittest.TestCase):

    @patch("browser_agent.agent.DecisionEngine")
    def test_agent_passes_value_provider_to_executor(self, mock_engine):
        from browser_agent.execution.value_provider import LocalValueProvider

        provider = LocalValueProvider(
            values={"applicant_name": "Demo User"},
            approved_references={"applicant_name"}
        )

        agent = BrowserAgent(
            allowed_domains=["example.com"],
            value_provider=provider
        )

        try:
            agent.start()

            self.assertIs(agent.executor.value_provider, provider)
            self.assertIsNotNone(agent.executor.form_filler)

        finally:
            agent.close()

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

            # First step: agent proposes a click but must request approval.
            result = agent.run_step(
                "Click the Continue button"
            )

            self.assertEqual(result["action"], "click")
            self.assertEqual(
                result["result"]["status"],
                "user_interaction_required"
            )
            self.assertEqual(result["task_status"], "awaiting_user")

            # Second step: simulate explicit user approval.
            approval_result = agent.approve_pending_action()

            self.assertEqual(
                approval_result["status"],
                "executed"
            )

            # Verify that the button click changed the webpage.
            self.assertIn(
                "Completed",
                agent.observer.page.locator("body").inner_text()
            )
            
            # Verify the actual browser state.
            button_text = agent.observer.page.get_by_role(
                "button",
                name="Completed"
            ).inner_text()

            self.assertEqual(button_text, "Completed")

        finally:
            agent.close()

    def create_agent_with_pending_action(self, mock_engine):
        proposed_action = {
            "action": "click",
            "target": "Submit application",
            "parameters": {},
            "reason": "Submit the application"
        }

        mock_engine.return_value.decide.return_value = proposed_action

        agent = BrowserAgent(
            allowed_domains=["example.com"]
        )

        agent.start()
        agent.navigate("https://example.com")

        agent.observer.page.set_content("""
            <!DOCTYPE html>
            <html>
                <body>
                    <button onclick="
                        this.textContent = 'Submitted';
                    ">
                        Submit application
                    </button>
                </body>
            </html>
        """)

        result = agent.run_step("Submit the application")

        return agent, proposed_action, result


    @patch("browser_agent.agent.DecisionEngine")
    def test_action_waits_for_approval(self, mock_engine):
        agent, proposed_action, result = (
            self.create_agent_with_pending_action(mock_engine)
        )

        try:
            self.assertEqual(
                result["task_status"],
                "awaiting_user"
            )

            self.assertEqual(
                agent.pending_action,
                proposed_action
            )

            button = agent.observer.page.get_by_role(
                "button",
                name="Submit application"
            )

            self.assertTrue(button.is_visible())

        finally:
            agent.close()


    @patch("browser_agent.agent.DecisionEngine")
    def test_approved_action_executes_once(self, mock_engine):
        agent, proposed_action, result = (
            self.create_agent_with_pending_action(mock_engine)
        )

        try:
            result = agent.approve_pending_action()

            self.assertEqual(result["status"], "executed")

            button = agent.observer.page.get_by_role(
                "button",
                name="Submitted"
            )

            self.assertTrue(button.is_visible())
            self.assertIsNone(agent.pending_action)

            with self.assertRaises(BrowserAgentError):
                agent.approve_pending_action()

        finally:
            agent.close()


    @patch("browser_agent.agent.DecisionEngine")
    def test_rejected_action_never_executes(self, mock_engine):
        agent, proposed_action, result = (
            self.create_agent_with_pending_action(mock_engine)
        )

        try:
            result = agent.reject_pending_action()

            self.assertEqual(result["status"], "rejected")
            self.assertIsNone(agent.pending_action)

            button = agent.observer.page.get_by_role(
                "button",
                name="Submit application"
            )

            self.assertTrue(button.is_visible())

            self.assertEqual(
                agent.task_manager.current_task["status"],
                "failed"
            )

        finally:
            agent.close()


    @patch("browser_agent.agent.DecisionEngine")
    def test_url_change_invalidates_pending_approval(self, mock_engine):
        agent, proposed_action, result = (
            self.create_agent_with_pending_action(mock_engine)
        )

        try:
            agent.navigate("https://example.com/other")

            with self.assertRaises(BrowserAgentError):
                agent.approve_pending_action()

            self.assertIsNone(agent.pending_action)

        finally:
            agent.close()

if __name__ == "__main__":
    unittest.main()