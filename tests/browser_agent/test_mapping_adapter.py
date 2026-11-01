import unittest

from browser_agent.integration.mapping_adapter import (
    MappingAdapter,
    MappingAdapterError,
)


class MappingAdapterTests(unittest.TestCase):

    def setUp(self):
        self.adapter = MappingAdapter()

    def test_basic_field_mapping(self):

        result = self.adapter.map_backend_fields({
            "full_name": "Example Person",
            "phone_number": "9000000001",
            "dob": "2005-01-01",
        })

        self.assertEqual(
            result["values"],
            {
                "full_name": "Example Person",
                "mobile_number": "9000000001",
                "date_of_birth": "2005-01-01",
            }
        )

        self.assertEqual(result["unsupported_fields"], [])

    def test_unsupported_field_reported(self):

        result = self.adapter.map_backend_fields({
            "full_name": "Example Person",
            "annual_family_income": "500000",
        })

        self.assertEqual(
            result["unsupported_fields"],
            ["annual_family_income"]
        )

        self.assertNotIn(
            "annual_family_income",
            result["values"]
        )

    def test_alias_collision_rejected(self):

        with self.assertRaises(MappingAdapterError):
            self.adapter.map_backend_fields({
                "phone_number": "9000000001",
                "mobile_number": "9000000002",
            })

    def test_non_string_value_rejected(self):

        with self.assertRaises(MappingAdapterError):
            self.adapter.map_backend_fields({
                "full_name": 123,
            })

    def test_unknown_field_never_becomes_reference(self):

        result = self.adapter.map_backend_fields({
            "password": "secret123",
        })

        self.assertEqual(result["values"], {})
        self.assertEqual(result["unsupported_fields"], ["password"])

    def test_provider_requires_explicit_approval(self):

        result = self.adapter.create_value_provider({
            "full_name": "Example Person",
        })

        provider = result["provider"]

        from browser_agent.execution.value_provider import (
            ValueProviderError,
        )

        with self.assertRaises(ValueProviderError):
            provider.resolve("full_name")

    def test_approved_reference_resolves_locally(self):

        result = self.adapter.create_value_provider(
            {"full_name": "Example Person"},
            approved_references={"full_name"},
        )

        self.assertEqual(
            result["provider"].resolve("full_name"),
            "Example Person"
        )


if __name__ == "__main__":
    unittest.main()


class MappingServiceRequestIntegrationTests:

    def setup_method(self):
        self.service_adapter = ServiceRequestAdapter(
            allowed_domains=["example.gov.in"]
        )

        self.safe_request = self.service_adapter.load({
            "service_id": "service_001",
            "service_name": "Duplicate Registration Certificate",
            "service_code": "DUP_RC",
            "portal_url": "https://example.gov.in/apply",
            "form_payload": {
                "full_name": "Test Citizen",
                "phone_number": "9876543210",
                "annual_family_income": "250000",
            },
            "file_attachments": [],
        })

        self.mapping_adapter = MappingAdapter()

    def test_creates_provider_from_service_request(self):
        result = (
            self.mapping_adapter
            .create_value_provider_from_service_request(
                self.service_adapter,
                self.safe_request,
                approved_references={"full_name"},
            )
        )

        provider = result["provider"]

        self.assertEqual(
            provider.resolve("full_name"),
            "Test Citizen",
        )

    def test_maps_phone_number_to_mobile_number(self):
        result = (
            self.mapping_adapter
            .create_value_provider_from_service_request(
                self.service_adapter,
                self.safe_request,
                approved_references={"mobile_number"},
            )
        )

        self.assertEqual(
            result["provider"].resolve("mobile_number"),
            "9876543210",
        )

    def test_unsupported_field_is_not_mapped(self):
        result = (
            self.mapping_adapter
            .create_value_provider_from_service_request(
                self.service_adapter,
                self.safe_request,
            )
        )

        self.assertIn(
            "annual_family_income",
            result["unsupported_fields"],
        )

    def test_values_require_explicit_approval(self):
        result = (
            self.mapping_adapter
            .create_value_provider_from_service_request(
                self.service_adapter,
                self.safe_request,
            )
        )

        with self.assertRaises(Exception):
            result["provider"].resolve("full_name")

    def test_safe_request_does_not_contain_private_values(self):
        assert "Test Citizen" not in str(self.safe_request)
        assert "9876543210" not in str(self.safe_request)