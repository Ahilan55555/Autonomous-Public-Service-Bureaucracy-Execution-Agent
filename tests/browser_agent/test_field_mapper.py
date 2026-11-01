import unittest

from browser_agent.integration.field_mapper import (
    FieldMappingError,
    build_mapping_prompt,
    validate_mapping,
)


class FieldMapperTests(unittest.TestCase):

    def setUp(self):
        self.request = {
            "service_name": "Duplicate RC",
            "form_field_names": ["registration_number", "full_name"],
        }

        self.observation = {
            "url": "https://parivahan.gov.in/",
            "title": "Vehicle Services",
            "headings": ["Duplicate Registration Certificate"],
            "buttons": ["Continue"],
            "links": ["Vehicle Related Services"],
            "input_fields": ["Registration Number", "Applicant Name"],
        }

    def test_prompt_contains_field_names(self):
        prompt = build_mapping_prompt(self.request, self.observation)
        self.assertIn("registration_number", prompt)
        self.assertIn("Applicant Name", prompt)

    def test_prompt_does_not_contain_private_values(self):
        self.request["private_test_value"] = "DO_NOT_SEND_123"
        prompt = build_mapping_prompt(self.request, self.observation)
        self.assertNotIn("DO_NOT_SEND_123", prompt)

    def test_valid_mapping(self):
        result = validate_mapping(
            {
                "mappings": [{
                    "request_field": "full_name",
                    "visible_field": "Applicant Name",
                    "confidence": 0.95,
                    "reason": "Applicant name field",
                }]
            },
            ["registration_number", "full_name"],
            ["Registration Number", "Applicant Name"],
        )
        self.assertEqual(len(result), 1)
        self.assertTrue(result[0]["requires_human_approval"])

    def test_unknown_request_field_rejected(self):
        with self.assertRaises(FieldMappingError):
            validate_mapping(
                {"mappings": [{
                    "request_field": "password",
                    "visible_field": "Applicant Name",
                    "confidence": 0.9,
                }]},
                ["full_name"],
                ["Applicant Name"],
            )

    def test_unknown_visible_field_rejected(self):
        with self.assertRaises(FieldMappingError):
            validate_mapping(
                {"mappings": [{
                    "request_field": "full_name",
                    "visible_field": "Secret Field",
                    "confidence": 0.9,
                }]},
                ["full_name"],
                ["Applicant Name"],
            )

    def test_invalid_confidence_rejected(self):
        with self.assertRaises(FieldMappingError):
            validate_mapping(
                {"mappings": [{
                    "request_field": "full_name",
                    "visible_field": "Applicant Name",
                    "confidence": 2,
                }]},
                ["full_name"],
                ["Applicant Name"],
            )


if __name__ == "__main__":
    unittest.main()