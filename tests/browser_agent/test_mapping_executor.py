import unittest
from unittest.mock import Mock

from browser_agent.integration.mapping_executor import (
    MappingExecutor,
    MappingExecutionError,
)
from browser_agent.execution.value_provider import LocalValueProvider


class MappingExecutorTests(unittest.TestCase):

    def setUp(self):
        self.browser = Mock()

        self.browser.value_provider = LocalValueProvider(
            values={"full_name": "Demo Citizen"},
            approved_references={"full_name"},
        )

        self.executor = MappingExecutor(self.browser)

        self.mapping = {
            "request_field": "full_name",
            "visible_field": "field_0001",
            "approved": True,
        }

    def test_unapproved_mapping_rejected(self):
        self.mapping["approved"] = False

        with self.assertRaises(MappingExecutionError):
            self.executor.execute_mapping(
                self.mapping,
                user_approved=True,
            )

    def test_unapproved_personal_data_rejected(self):
        self.browser.value_provider = LocalValueProvider(
            values={"full_name": "Demo Citizen"},
            approved_references=set(),
        )

        with self.assertRaises(MappingExecutionError):
            self.executor.execute_mapping(
                self.mapping,
                user_approved=True,
            )

    def test_browser_approval_required(self):
        result = self.executor.execute_mapping(
            self.mapping,
            user_approved=False,
        )

        self.assertEqual(
            result["status"],
            "awaiting_user_approval",
        )

        self.browser.execute.assert_not_called()

    def test_gemini_cannot_choose_value_reference(self):
        self.browser.execute.return_value = {
            "status": "executed",
            "verified": True,
        }

        self.executor.execute_mapping(
            self.mapping,
            user_approved=True,
        )

        action = self.browser.execute.call_args.args[0]

        self.assertEqual(
            action["parameters"]["value_ref"],
            "full_name",
        )

    def test_successful_execution(self):
        self.browser.execute.return_value = {
            "status": "executed",
            "verified": True,
        }

        result = self.executor.execute_mapping(
            self.mapping,
            user_approved=True,
        )

        self.assertEqual(result["status"], "executed")
        self.assertTrue(result["verified"])

    def test_unknown_field_rejected(self):
        self.mapping["request_field"] = "password"

        with self.assertRaises(MappingExecutionError):
            self.executor.execute_mapping(
                self.mapping,
                user_approved=True,
            )


if __name__ == "__main__":
    unittest.main()