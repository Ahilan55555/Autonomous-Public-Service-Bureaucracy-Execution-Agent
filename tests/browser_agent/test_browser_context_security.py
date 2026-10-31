import unittest

from browser_agent.perception.observer import BrowserObserver


class BrowserContextSecurityTests(unittest.TestCase):

    def setUp(self):
        self.observer = BrowserObserver(
            allowed_domains=["example.com"]
        )
        self.page = self.observer.start()

    def tearDown(self):
        self.observer.close()

    def test_javascript_external_navigation_is_blocked(self):

        self.observer.navigate("https://example.com")

        original_url = self.page.url

        self.page.evaluate("""
            window.location.href = "https://attacker.invalid";
        """)

        self.page.wait_for_timeout(2000)

        blocked_attempts = self.observer.blocked_navigation_attempts

        self.assertTrue(
            any(
                attempt["reason"] == "unauthorized_navigation"
                for attempt in blocked_attempts
            ),
            "Unauthorized navigation was not intercepted"
        )

        # Verify that the browser can recover by navigating
        # back to an approved destination.
        self.observer.navigate("https://example.com")

        self.assertEqual(
            self.page.url,
            original_url
        )


if __name__ == "__main__":
    unittest.main()