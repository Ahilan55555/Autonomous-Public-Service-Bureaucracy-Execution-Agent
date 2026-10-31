from playwright.sync_api import sync_playwright

from browser_agent.compatibility.browser_config import (
    get_browser_config
)

from browser_agent.perception.dom_extractor import (
    extract_dom
)


class BrowserObserver:

    def __init__(self):

        self.playwright = None
        self.browser = None
        self.page = None

    def start(self):

        self.playwright = sync_playwright().start()

        config = get_browser_config()

        self.browser = self.playwright.chromium.launch(
            **config.get_launch_options()
        )

        self.page = self.browser.new_page()

        return self.page

    def navigate(self, url):

        if self.page is None:
            raise RuntimeError("Browser has not been started")

        response = self.page.goto(
            url,
            wait_until="domcontentloaded",
            timeout=30000
        )

        return {
            "status": response.status if response else None,
            "url": self.page.url
        }

    def observe(self):

        if self.page is None:
            raise RuntimeError("Browser has not been started")

        return extract_dom(self.page)

    def close(self):

        if self.browser:
            self.browser.close()
            self.browser = None

        if self.playwright:
            self.playwright.stop()
            self.playwright = None

        self.page = None