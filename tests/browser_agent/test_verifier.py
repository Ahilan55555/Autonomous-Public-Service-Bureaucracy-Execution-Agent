import unittest

from browser_agent.verification.verifier import (
    ActionVerifier,
    VerificationStatus,
)


class VerifierTests(unittest.TestCase):

    def setUp(self):
        self.verifier = ActionVerifier()

        self.before = {
            "title": "Application",
            "headings": ["Application Form"],
            "buttons": ["Continue"],
            "links": [],
            "input_fields": [],
        }

    def test_detects_structural_change(self):

        after = {
            "title": "Confirmation",
            "headings": ["Application Submitted"],
            "buttons": [],
            "links": [],
            "input_fields": [],
        }

        result = self.verifier.verify_click(
            self.before,
            after,
            "Continue",
            {"status": "executed"},
        )

        self.assertEqual(
            result["status"],
            VerificationStatus.SUCCESS.value,
        )

    def test_returns_uncertain_without_change(self):

        result = self.verifier.verify_click(
            self.before,
            self.before.copy(),
            "Continue",
            {"status": "executed"},
        )

        self.assertEqual(
            result["status"],
            VerificationStatus.UNCERTAIN.value,
        )

    def test_returns_failure_when_execution_failed(self):

        result = self.verifier.verify_click(
            self.before,
            self.before,
            "Continue",
            {"status": "failed"},
        )

        self.assertEqual(
            result["status"],
            VerificationStatus.FAILURE.value,
        )


if __name__ == "__main__":
    unittest.main()