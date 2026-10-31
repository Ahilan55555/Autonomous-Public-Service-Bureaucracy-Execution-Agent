import unittest
from unittest.mock import MagicMock

from browser_agent.execution.navigation import (
    SafeNavigator,
    NavigationError,
)


class SafeNavigatorTests(unittest.TestCase):

    def setUp(self):
        self.page = MagicMock()
        self.page.url = "https://portal.example.gov.in/login"
        self.page.is_closed.return_value = False

        self.navigator = SafeNavigator(
            page=self.page,
            allowed_domains=["example.gov.in"]
        )

    def test_successful_navigation(self):
        response = MagicMock()
        response.status = 200
        self.page.goto.return_value = response

        result = self.navigator.navigate(
            "https://portal.example.gov.in/login"
        )

        self.assertEqual(result["status"], "navigated")
        self.assertEqual(result["http_status"], 200)
        self.page.route.assert_called_once()
        self.page.unroute.assert_called_once()

    def test_external_domain_rejected_before_navigation(self):
        with self.assertRaises(NavigationError):
            self.navigator.navigate("https://attacker.com")

        self.page.goto.assert_not_called()

    def test_http_navigation_rejected(self):
        with self.assertRaises(NavigationError):
            self.navigator.navigate(
                "http://portal.example.gov.in"
            )

        self.page.goto.assert_not_called()

    def test_closed_page_rejected(self):
        self.page.is_closed.return_value = True

        with self.assertRaises(NavigationError):
            self.navigator.navigate(
                "https://portal.example.gov.in/login"
            )

        self.page.goto.assert_not_called()

    def test_unauthorized_redirect_blocked(self):
        captured = {}

        def capture_route(pattern, handler):
            captured["handler"] = handler

        self.page.route.side_effect = capture_route

        def simulate_redirect(url):
            route = MagicMock()
            route.request.is_navigation_request.return_value = True
            route.request.url = url

            captured["handler"](route)

            route.abort.assert_called_once()

            raise Exception("Navigation blocked")

        self.page.goto.side_effect = lambda *args, **kwargs: (
            simulate_redirect("https://attacker.com")
        )

        with self.assertRaises(NavigationError):
            self.navigator.navigate(
                "https://portal.example.gov.in/login"
            )

        self.page.unroute.assert_called_once()


if __name__ == "__main__":
    unittest.main()