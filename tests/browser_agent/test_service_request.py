import unittest

from browser_agent.integration.service_request import (
    ServiceRequestAdapter,
    ServiceRequestError,
)


class ServiceRequestTests(unittest.TestCase):

    def setUp(self):
        self.adapter = ServiceRequestAdapter(["parivahan.gov.in"])
        self.request = {
            "service_id": 54,
            "service_name": "Duplicate Registration Certificate",
            "service_code": "TN_MORTH_RC_REISSUE",
            "portal_url": "https://parivahan.gov.in",
            "governance_tier": "state",
            "ready_for_dispatch": True,
            "missing_form_fields": [],
            "missing_documents": [],
            "form_payload": {
                "registration_number": "TEST_REGISTRATION",
                "full_name": "Test Applicant",
                "email": "test@example.invalid",
                "mobile_number": "9000000001",
            },
            "file_attachments": [
                {
                    "requirement": "FIR",
                    "filename": "test_fir.pdf",
                    "download_url": "https://storage.example.invalid/signed?token=SECRET"
                }
            ],
        }

    def test_valid_request(self):
        safe = self.adapter.load(self.request)
        self.assertEqual(safe["service_id"], 54)
        self.assertEqual(safe["portal_url"], "https://parivahan.gov.in")

    def test_actual_values_not_in_safe_request(self):
        safe = self.adapter.load(self.request)
        rendered = repr(safe)
        self.assertNotIn("TEST_REGISTRATION", rendered)
        self.assertNotIn("Test Applicant", rendered)
        self.assertNotIn("9000000001", rendered)

    def test_signed_url_not_in_safe_request_or_task(self):
        safe = self.adapter.load(self.request)
        task = self.adapter.build_llm_task(safe)
        self.assertNotIn("SECRET", repr(safe))
        self.assertNotIn("storage.example.invalid", repr(safe))
        self.assertNotIn("SECRET", task)

    def test_local_value_available_to_python(self):
        self.adapter.load(self.request)
        self.assertEqual(
            self.adapter.get_local_value("registration_number"),
            "TEST_REGISTRATION",
        )

    def test_unknown_value_reference_rejected(self):
        self.adapter.load(self.request)
        with self.assertRaises(ServiceRequestError):
            self.adapter.get_local_value("unknown_field")

    def test_unapproved_domain_rejected(self):
        self.request["portal_url"] = "https://evil.example.com"
        with self.assertRaises(ServiceRequestError):
            self.adapter.load(self.request)

    def test_http_rejected(self):
        self.request["portal_url"] = "http://parivahan.gov.in"
        with self.assertRaises(ServiceRequestError):
            self.adapter.load(self.request)

    def test_missing_required_key_rejected(self):
        del self.request["form_payload"]
        with self.assertRaises(ServiceRequestError):
            self.adapter.load(self.request)

    def test_attachment_source_not_exposed(self):
        safe = self.adapter.load(self.request)
        self.assertNotIn("download_url", repr(safe))
        self.assertNotIn("token", repr(safe).lower())


if __name__ == "__main__":
    unittest.main()