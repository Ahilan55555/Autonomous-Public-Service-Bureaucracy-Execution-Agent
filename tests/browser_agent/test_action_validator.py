import unittest

from browser_agent.security.action_validator import (
    authorize_action,
    ActionAuthorizationError,
    ApprovalRequiredError,
)


class ActionValidatorTests(unittest.TestCase):

    def setUp(self):
        self.allowed_domains = ["example.gov.in"]
        self.current_url = "https://portal.example.gov.in/application"

    def make_action(self, action, target, parameters=None):
        return {
            "action": action,
            "target": target,
            "parameters": parameters or {},
            "reason": "Test action",
        }

    def test_allowed_navigation(self):
        action = self.make_action(
            "navigate",
            "https://portal.example.gov.in/login"
        )

        result = authorize_action(
            action,
            self.allowed_domains
        )

        self.assertTrue(result["allowed"])

    def test_external_domain_rejected(self):
        action = self.make_action(
            "navigate",
            "https://attacker.com"
        )

        with self.assertRaises(ActionAuthorizationError):
            authorize_action(action, self.allowed_domains)

    def test_http_navigation_rejected(self):
        action = self.make_action(
            "navigate",
            "http://portal.example.gov.in"
        )

        with self.assertRaises(ActionAuthorizationError):
            authorize_action(action, self.allowed_domains)

    def test_embedded_credentials_rejected(self):
        action = self.make_action(
            "navigate",
            "https://user:password@portal.example.gov.in"
        )

        with self.assertRaises(ActionAuthorizationError):
            authorize_action(action, self.allowed_domains)

    def test_allowed_click(self):
        action = self.make_action("click", "Continue")

        with self.assertRaises(ApprovalRequiredError):
            authorize_action(
                action,
                self.allowed_domains,
                current_url=self.current_url
            )

        result = authorize_action(
            action,
            self.allowed_domains,
            current_url=self.current_url,
            user_approved=True
        )

        self.assertTrue(result["allowed"])
        self.assertTrue(result["requires_approval"])

    def test_click_on_unapproved_page_rejected(self):
        action = self.make_action("click", "Continue")

        with self.assertRaises(ActionAuthorizationError):
            authorize_action(
                action,
                self.allowed_domains,
                current_url="https://attacker.com"
            )

    def test_submission_requires_approval(self):
        action = self.make_action("click", "Submit Application")

        with self.assertRaises(ApprovalRequiredError):
            authorize_action(
                action,
                self.allowed_domains,
                current_url=self.current_url
            )

    def test_submission_allowed_after_approval(self):
        action = self.make_action("click", "Submit Application")

        result = authorize_action(
            action,
            self.allowed_domains,
            current_url=self.current_url,
            user_approved=True
        )

        self.assertTrue(result["allowed"])
        self.assertTrue(result["requires_approval"])

    def test_sensitive_fill_reference_rejected(self):
        action = self.make_action(
            "fill",
            "Password",
            {"value_ref": "user.password"}
        )

        with self.assertRaises(ActionAuthorizationError):
            authorize_action(
                action,
                self.allowed_domains,
                current_url=self.current_url
            )

    def test_fill_requires_user_approval(self):
        action = self.make_action(
            "fill",
            "Full Name",
            {"value_ref": "user.full_name"}
        )

        with self.assertRaises(ApprovalRequiredError):
            authorize_action(
                action,
                self.allowed_domains,
                current_url=self.current_url
            )

    def test_fill_allowed_after_approval(self):
        action = self.make_action(
            "fill",
            "Full Name",
            {"value_ref": "user.full_name"}
        )

        result = authorize_action(
            action,
            self.allowed_domains,
            current_url=self.current_url,
            user_approved=True
        )

        self.assertTrue(result["allowed"])
        self.assertTrue(result["requires_approval"])

        self.assertTrue(result["allowed"])

    def test_request_approval_does_not_grant_approval(self):
        action = self.make_action(
            "request_approval",
            "Submit application"
        )

        result = authorize_action(
            action,
            self.allowed_domains
        )

        self.assertTrue(result["allowed"])

        # This action only requests approval.
        # It does not authorize a later submission.
        self.assertFalse(result["requires_approval"])

    def test_invalid_approval_type_rejected(self):
        action = self.make_action("click", "Continue")

        with self.assertRaises(ActionAuthorizationError):
            authorize_action(
                action,
                self.allowed_domains,
                current_url=self.current_url,
                user_approved="yes"
            )


if __name__ == "__main__":
    unittest.main()
