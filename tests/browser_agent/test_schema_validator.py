import unittest

from browser_agent.security.schema_validator import (
    validate_action,
    SchemaValidationError,
)


class SchemaValidatorTests(unittest.TestCase):

    def setUp(self):
        self.valid_action = {
            "action": "click",
            "target": "Continue",
            "parameters": {},
            "reason": "Proceed to the next section",
        }

    def test_valid_click_action(self):
        result = validate_action(self.valid_action)
        self.assertEqual(result["action"], "click")
        self.assertEqual(result["target"], "Continue")

    def test_valid_fill_action(self):
        action = {
            "action": "fill",
            "target": "Full Name",
            "parameters": {
                "value_ref": "user.full_name"
            },
            "reason": "Fill applicant name",
        }

        result = validate_action(action)

        self.assertEqual(
            result["parameters"]["value_ref"],
            "user.full_name"
        )

    def test_valid_wait_action(self):
        action = {
            "action": "wait",
            "target": "application-form",
            "parameters": {
                "timeout_ms": 5000
            },
            "reason": "Wait for form loading",
        }

        result = validate_action(action)

        self.assertEqual(
            result["parameters"]["timeout_ms"],
            5000
        )

    def test_unknown_action_rejected(self):
        action = self.valid_action.copy()
        action["action"] = "execute_command"

        with self.assertRaises(SchemaValidationError):
            validate_action(action)

    def test_unexpected_field_rejected(self):
        action = self.valid_action.copy()
        action["command"] = "rm -rf /"

        with self.assertRaises(SchemaValidationError):
            validate_action(action)

    def test_missing_field_rejected(self):
        action = self.valid_action.copy()
        del action["reason"]

        with self.assertRaises(SchemaValidationError):
            validate_action(action)

    def test_raw_fill_value_rejected(self):
        action = {
            "action": "fill",
            "target": "Full Name",
            "parameters": {
                "value": "Actual confidential value"
            },
            "reason": "Fill applicant name",
        }

        with self.assertRaises(SchemaValidationError):
            validate_action(action)

    def test_invalid_value_reference_rejected(self):
        action = {
            "action": "fill",
            "target": "Full Name",
            "parameters": {
                "value_ref": "__import__('os').system('id')"
            },
            "reason": "Fill applicant name",
        }

        with self.assertRaises(SchemaValidationError):
            validate_action(action)

    def test_invalid_timeout_rejected(self):
        action = {
            "action": "wait",
            "target": "application-form",
            "parameters": {
                "timeout_ms": 999999
            },
            "reason": "Wait for form",
        }

        with self.assertRaises(SchemaValidationError):
            validate_action(action)

    def test_boolean_timeout_rejected(self):
        action = {
            "action": "wait",
            "target": "application-form",
            "parameters": {
                "timeout_ms": True
            },
            "reason": "Wait for form",
        }

        with self.assertRaises(SchemaValidationError):
            validate_action(action)


if __name__ == "__main__":
    unittest.main()
