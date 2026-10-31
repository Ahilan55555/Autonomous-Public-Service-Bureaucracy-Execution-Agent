import unittest

from browser_agent.execution.value_provider import (
    LocalValueProvider,
    ValueProviderError,
)


class LocalValueProviderTests(unittest.TestCase):

    def setUp(self):

        self.provider = LocalValueProvider(
            values={
                "applicant_name": "Example Person",
                "email": "example@example.com",
            },
            approved_references={
                "applicant_name",
                "email",
            },
        )

    def test_resolve_approved_value(self):

        value = self.provider.resolve("applicant_name")

        self.assertEqual(value, "Example Person")

    def test_unapproved_reference_rejected(self):

        provider = LocalValueProvider(
            values={"applicant_name": "Example Person"},
            approved_references=set(),
        )

        with self.assertRaises(ValueProviderError):
            provider.resolve("applicant_name")

    def test_password_reference_rejected(self):

        with self.assertRaises(ValueProviderError):
            self.provider.resolve("password")

    def test_unknown_reference_rejected(self):

        with self.assertRaises(ValueProviderError):
            self.provider.resolve("unknown_field")

    def test_missing_value_rejected(self):

        provider = LocalValueProvider(
            values={},
            approved_references={"applicant_name"},
        )

        with self.assertRaises(ValueProviderError):
            provider.resolve("applicant_name")

    def test_non_string_value_rejected(self):

        provider = LocalValueProvider(
            values={"applicant_name": 123},
            approved_references={"applicant_name"},
        )

        with self.assertRaises(ValueProviderError):
            provider.resolve("applicant_name")


if __name__ == "__main__":
    unittest.main()