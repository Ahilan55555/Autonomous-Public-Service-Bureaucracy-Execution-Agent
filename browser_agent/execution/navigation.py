from browser_agent.security.action_validator import (
    authorize_action,
)


class NavigationError(Exception):
    """Raised when safe browser navigation fails."""
    pass


class SafeNavigator:

    def __init__(self, page, allowed_domains, timeout=30000):
        if page is None:
            raise NavigationError("A valid Playwright page is required")

        self.page = page
        self.allowed_domains = allowed_domains
        self.timeout = timeout

    def _authorize_url(self, url):
        action = {
            "action": "navigate",
            "target": url,
            "parameters": {},
            "reason": "Authorized browser navigation",
        }

        try:
            result = authorize_action(
                action,
                allowed_domains=self.allowed_domains,
            )
        except Exception as error:
            raise NavigationError(
                "Navigation destination is not authorized"
            ) from error

        if not result.get("allowed"):
            raise NavigationError(
                "Navigation destination was rejected"
            )

    def navigate(self, url):

        if self.page.is_closed():
            raise NavigationError("Browser page is closed")

        # Validate the initial destination before navigation.
        self._authorize_url(url)

        blocked_destinations = []

        def navigation_guard(route):
            request = route.request

            if request.is_navigation_request():
                try:
                    self._authorize_url(request.url)
                except NavigationError:
                    blocked_destinations.append(request.url)
                    route.abort()
                    return

            route.continue_()

        try:
            self.page.route("**/*", navigation_guard)

            try:
                response = self.page.goto(
                    url,
                    wait_until="domcontentloaded",
                    timeout=self.timeout,
                )
            finally:
                self.page.unroute("**/*", navigation_guard)

        except Exception as error:
            if blocked_destinations:
                raise NavigationError(
                    "Navigation or redirect to an unauthorized "
                    "destination was blocked"
                ) from error

            raise NavigationError(
                "Browser navigation failed"
            ) from error

        # Independently validate the final destination.
        self._authorize_url(self.page.url)

        return {
            "status": "navigated",
            "url": self.page.url,
            "http_status": response.status if response else None,
        }