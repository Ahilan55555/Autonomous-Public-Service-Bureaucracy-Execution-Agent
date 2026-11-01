import unittest
from unittest.mock import Mock, patch

from browser_agent.agent import BrowserAgent


class MultiStepAgentTests(unittest.TestCase):

    @patch("browser_agent.agent.DecisionEngine")
    def test_agent_stops_when_model_returns_stop(self, mock_engine):

        mock_engine.return_value.decide.side_effect = [
            {
                "action": "click",
                "target": "Continue",
                "parameters": {},
                "reason": "Continue the workflow",
            },
            {
                "action": "stop",
                "target": "current_task",
                "parameters": {},
                "reason": "Task completed",
            },
        ]

        agent = BrowserAgent(allowed_domains=["example.com"])

        agent.executor = Mock()

        agent.observer.observe = Mock(
            return_value={
                "title": "Test",
                "headings": [],
                "buttons": [],
                "links": [],
                "input_fields": [],
            }
        )

        agent.executor.execute.side_effect = [
            {"status": "executed", "action": "click"},
            {"status": "stopped", "action": "stop"},
        ]

        agent.verifier.verify_click = Mock(
            return_value={
                "status": "success",
                "reason": "Test verification",
            }
        )
        result = agent.run_task("Complete the test workflow")

        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["steps_completed"], 2)
        self.assertEqual(agent.task_manager.current_task["status"], "completed")

    @patch("browser_agent.agent.DecisionEngine")
    def test_agent_stops_when_verification_is_uncertain(self, mock_engine):

        mock_engine.return_value.decide.return_value = {
            "action": "click",
            "target": "Continue",
            "parameters": {},
            "reason": "Continue the workflow",
        }

        agent = BrowserAgent(allowed_domains=["example.com"])
        agent.executor = Mock()

        observation = {
            "title": "Test",
            "headings": [],
            "buttons": [],
            "links": [],
            "input_fields": [],
        }

        agent.observer.observe = Mock(return_value=observation)

        agent.executor.execute.return_value = {
            "status": "executed",
            "action": "click",
        }

        agent.verifier.verify_click = Mock(
            return_value={
                "status": "uncertain",
                "reason": "No observable change",
            }
        )

        result = agent.run_task("Complete the test workflow")

        self.assertEqual(result["status"], "awaiting_user")
        self.assertEqual(result["steps_completed"], 1)


if __name__ == "__main__":
    unittest.main()