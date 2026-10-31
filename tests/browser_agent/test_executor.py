import unittest
from unittest.mock import MagicMock

from browser_agent.execution.executor import (
    BrowserExecutor,
    ExecutionError,
)


class BrowserExecutorTests(unittest.TestCase):

    def setUp(self):
        self.page = MagicMock()
        self.page.url = "https://portal.example.gov.in/application"
        self.page.is_closed.return_value = False

        self.executor = BrowserExecutor(
            page=self.page,
            allowed_domains=["example.gov.in"]
        )

    def make_action(self, action, target, parameters=None):
        return {
            "action": action,
            "target": target,
            "parameters": parameters or {},
            "reason": "Test action",
        }

    def test_successful_button_click(self):
        button = MagicMock()
        link = MagicMock()

        self.page.get_by_role.side_effect = [
            button,
            link
        ]

        button.count.return_value = 1
        button.is_visible.return_value = True
        button.is_enabled.return_value = True

        link.count.return_value = 0

        action = self.make_action("click", "Continue")

        result = self.executor.execute(action)

        self.assertEqual(result["status"], "executed")
        button.click.assert_called_once_with(timeout=5000)
        link.click.assert_not_called()

    def test_missing_target_rejected(self):
        button = MagicMock()
        link = MagicMock()

        button.count.return_value = 0
        link.count.return_value = 0

        self.page.get_by_role.side_effect = [button, link]

        action = self.make_action("click", "Missing")

        with self.assertRaises(ExecutionError):
            self.executor.execute(action)

    def test_duplicate_targets_rejected(self):
        button = MagicMock()
        link = MagicMock()

        button.count.return_value = 2
        link.count.return_value = 0

        self.page.get_by_role.side_effect = [button, link]

        action = self.make_action("click", "Continue")

        with self.assertRaises(ExecutionError):
            self.executor.execute(action)

    def test_disabled_target_rejected(self):
        button = MagicMock()
        link = MagicMock()

        button.count.return_value = 1
        button.is_visible.return_value = True
        button.is_enabled.return_value = False

        link.count.return_value = 0

        self.page.get_by_role.side_effect = [button, link]

        action = self.make_action("click", "Continue")

        with self.assertRaises(ExecutionError):
            self.executor.execute(action)

        button.click.assert_not_called()

    def test_external_domain_rejected(self):
        self.page.url = "https://attacker.com"

        action = self.make_action("click", "Continue")

        with self.assertRaises(ExecutionError):
            self.executor.execute(action)

    def test_closed_page_rejected(self):
        self.page.is_closed.return_value = True

        action = self.make_action("click", "Continue")

        with self.assertRaises(ExecutionError):
            self.executor.execute(action)

    def test_stop_action(self):
        action = self.make_action("stop", "current_task")

        result = self.executor.execute(action)

        self.assertEqual(result["status"], "stopped")

    def test_request_approval_does_not_execute_click(self):
        action = self.make_action(
            "request_approval",
            "Submit application"
        )

        result = self.executor.execute(action)

        self.assertEqual(
            result["status"],
            "user_interaction_required"
        )

        self.page.get_by_role.assert_not_called()

    def test_click_failure_after_initial_target_check(self):
        button = MagicMock()
        link = MagicMock()

        self.page.get_by_role.side_effect = [button, link]

        button.count.return_value = 1
        button.is_visible.return_value = True
        button.is_enabled.return_value = True

        link.count.return_value = 0

        # Simulate Playwright detecting a problem at click time.
        button.click.side_effect = Exception(
            "Strict mode violation: multiple elements matched"
        )

        action = self.make_action("click", "Continue")

        with self.assertRaises(ExecutionError):
            self.executor.execute(action)

        button.click.assert_called_once()


if __name__ == "__main__":
    unittest.main()