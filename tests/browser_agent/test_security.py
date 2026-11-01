import unittest

from browser_agent.security.data_classifier import (
    classify_field
)

from browser_agent.security.sanitizer import (
    sanitize_observation
)

from browser_agent.security.privacy_guard import (
    validate_llm_payload,
    PrivacyViolation
)


class SecurityTests(unittest.TestCase):

    def setUp(self):

        self.observation = {

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

            "links": [],

            "input_fields": [

                {
                    "field_ref": "field_0001",
                    "type": "text",
                    "name": "search",
                    "required": False,
                    "disabled": False
                },  

                {
                    "type": "text",
                    "name": "full_name",
                    "value": "TEST_PERSON_SECRET",
                    "required": True
                },

                {
                    "type": "text",
                    "name": "aadhaar_number",
                    "value": "TEST_AADHAAR_SECRET"
                },

                {
                    "type": "password",
                    "name": "password",
                    "value": "TEST_PASSWORD_SECRET"
                },

                {
                    "type": "text",
                    "name": "otp",
                    "value": "123456"
                }
            ]
        }

    def test_field_classification(self):

        self.assertEqual(
            classify_field({"type": "password"}),
            "NEVER_SEND"
        )

        self.assertEqual(
            classify_field({"name": "otp", "type": "text"}),
            "NEVER_SEND"
        )

        self.assertEqual(
            classify_field({"name": "aadhaar_number"}),
            "CONFIDENTIAL"
        )

        self.assertEqual(
            classify_field({"name": "full_name"}),
            "PERSONAL"
        )

        self.assertEqual(
            classify_field({"name": "search"}),
            "PUBLIC"
        )

    def test_vehicle_identifiers_are_confidential(self):
        fields = [
            {"name": "registration_number"},
            {"name": "vehicle_number"},
            {"name": "vehicle_registration"},
            {"name": "chassis_number"},
            {"name": "engine_number"},
            {"name": "driving_license"},
            {"name": "driving_licence"},
            {"name": "license_number"},
            {"name": "licence_number"},
            {"name": "rc_number"},
        ]

        for field in fields:
            with self.subTest(field=field):
                self.assertEqual(
                    classify_field(field),
                    "CONFIDENTIAL"
                )

    def test_username_is_not_misclassified_as_personal_name(self):
        self.assertEqual(
            classify_field({"type": "text", "name": "username"}),
            "PUBLIC"
        )


    def test_personal_name_variations_are_classified(self):
        fields = [
            {"name": "full_name"},
            {"name": "first_name"},
            {"name": "last_name"},
        ]

        for field in fields:
            with self.subTest(field=field):
                self.assertEqual(
                    classify_field(field),
                    "PERSONAL"
                )


    def test_authentication_metadata_is_never_send(self):
        fields = [
            {"name": "verification_code"},
            {"name": "security_code"},
            {"name": "one_time_password"},
        ]

        for field in fields:
            with self.subTest(field=field):
                self.assertEqual(
                    classify_field(field),
                    "NEVER_SEND"
                )

    def test_sensitive_values_are_excluded(self):

        safe_data = sanitize_observation(
            self.observation
        )

        output = str(safe_data)

        self.assertNotIn(
            "TEST_PERSON_SECRET",
            output
        )

        self.assertNotIn(
            "TEST_AADHAAR_SECRET",
            output
        )

        self.assertNotIn(
            "TEST_PASSWORD_SECRET",
            output
        )

        self.assertNotIn(
            "123456",
            output
        )

    def test_public_field_is_preserved(self):

        safe_data = sanitize_observation(
            self.observation
        )

        self.assertEqual(
            len(safe_data["input_fields"]),
            1
        )

        self.assertTrue(
            safe_data["security"]["personal_values_included"]
            is False
        )

    def test_privacy_guard_accepts_safe_data(self):

        safe_data = sanitize_observation(
            self.observation
        )

        self.assertTrue(
            validate_llm_payload(safe_data)
        )

    def test_privacy_guard_blocks_sensitive_data(self):

        unsafe_data = {

            "title": "Government Services",

            "security": {
                "personal_values_included": False,
                "confidential_values_included": False,
                "authentication_values_included": False
            },

            "password": "my_secret_password"
        }

        with self.assertRaises(PrivacyViolation):

            validate_llm_payload(unsafe_data)


if __name__ == "__main__":

    unittest.main(verbosity=2)