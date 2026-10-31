import unittest

from browser_agent.intelligence.response_parser import (
    parse_model_response,
    ResponseParsingError,
)


class TestResponseParser(unittest.TestCase):

    def test_valid_navigate_action(self):
        raw = """
        {
            "action": "navigate",
            "target": "https://example.com",
            "parameters": {},
            "reason": "Open the requested website"
        }
        """

        result = parse_model_response(raw)

        self.assertEqual(result["action"], "navigate")

    def test_valid_stop_action(self):
        raw = """
        {
            "action": "stop",
            "target": "current_task",
            "parameters": {},
            "reason": "Task completed"
        }
        """

        result = parse_model_response(raw)

        self.assertEqual(result["action"], "stop")

    def test_malformed_json(self):
        with self.assertRaises(ResponseParsingError):
            parse_model_response('{"action": "navigate"')

    def test_empty_response(self):
        with self.assertRaises(ResponseParsingError):
            parse_model_response("")

    def test_non_string_response(self):
        with self.assertRaises(ResponseParsingError):
            parse_model_response({"action": "stop"})

    def test_json_array_rejected(self):
        with self.assertRaises(ResponseParsingError):
            parse_model_response('[{"action": "stop"}]')

    def test_duplicate_keys_rejected(self):
        raw = """
        {
            "action": "stop",
            "action": "navigate",
            "target": "",
            "parameters": {},
            "reason": "Test"
        }
        """

        with self.assertRaises(ResponseParsingError):
            parse_model_response(raw)

    def test_non_standard_json_number_rejected(self):
        raw = """
        {
            "action": "wait",
            "target": "",
            "parameters": {"timeout_ms": NaN},
            "reason": "Test"
        }
        """

        with self.assertRaises(ResponseParsingError):
            parse_model_response(raw)

    def test_unknown_action_rejected(self):
        raw = """
        {
            "action": "delete_everything",
            "target": "",
            "parameters": {},
            "reason": "Test"
        }
        """

        with self.assertRaises(ResponseParsingError):
            parse_model_response(raw)


if __name__ == "__main__":
    unittest.main()