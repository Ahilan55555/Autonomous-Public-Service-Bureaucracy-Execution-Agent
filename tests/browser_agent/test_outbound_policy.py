import unittest

from browser_agent.security.outbound_policy import (
    build_outbound_payload,
    OutboundPolicyError
)


class OutboundPolicyTests(unittest.TestCase):

    def setUp(self):

        self.safe_observation = {

            "title": "Government Services",

            "headings": [
                "Income Certificate Application"
            ],

            "buttons": [
                {
                    "text": "Submit",
                    "disabled": False
                }
            ],

            "links": [
                {
                    "text": "Home",
                    "visible": True
                }
            ],

            "input_fields": [
                {
                    "type": "text",
                    "required": True,
                    "disabled": False
                }
            ],

            "security": {
                "personal_values_included": False,
                "confidential_values_included": False,
                "authentication_values_included": False
            }
        }

    def test_valid_payload(self):

        result = build_outbound_payload(
            self.safe_observation
        )

        self.assertEqual(
            result["title"],
            "Government Services"
        )

    def test_security_metadata_not_forwarded(self):

        result = build_outbound_payload(
            self.safe_observation
        )

        self.assertNotIn("security", result)

    def test_unknown_field_rejected(self):

        malicious = self.safe_observation.copy()

        malicious["password"] = "secret"

        with self.assertRaises(OutboundPolicyError):

            build_outbound_payload(malicious)

    def test_sensitive_field_metadata_rejected(self):

        malicious = self.safe_observation.copy()

        malicious["input_fields"] = [
            {
                "type": "password",
                "required": True,
                "disabled": False
            }
        ]

        with self.assertRaises(OutboundPolicyError):

            build_outbound_payload(malicious)

    def test_oversized_heading_rejected(self):

        malicious = self.safe_observation.copy()

        malicious["headings"] = [
            "A" * 1000
        ]

        with self.assertRaises(OutboundPolicyError):

            build_outbound_payload(malicious)


if __name__ == "__main__":

    unittest.main(verbosity=2)