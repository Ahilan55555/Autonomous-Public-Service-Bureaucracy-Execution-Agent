import unittest

from playwright.sync_api import sync_playwright

from browser_agent.perception.dom_extractor import extract_dom
from browser_agent.execution.field_registry import (
    FieldRegistry,
    FieldRegistryError,
)


HTML = """
<html>
<body>
    <label for="name">Applicant Name</label>
    <input id="name" name="applicant_name" type="text">

    <label for="dob">Date of Birth</label>
    <input id="dob" name="dob" type="date">

    <label for="password">Password</label>
    <input id="password" type="password">
</body>
</html>
"""


class FieldRegistryTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.page = self.browser.new_page()
        self.page.set_content(HTML)

        observation = extract_dom(self.page)

        self.registry = FieldRegistry(self.page)
        self.registry.register(observation)

    def tearDown(self):
        self.page.close()

    def test_resolve_existing_field(self):
        element = self.registry.resolve("field_0001")

        self.assertEqual(element.get_attribute("id"), "name")

    def test_resolve_date_field(self):
        element = self.registry.resolve("field_0002")

        self.assertEqual(element.get_attribute("type"), "date")

    def test_unknown_reference_rejected(self):
        with self.assertRaises(FieldRegistryError):
            self.registry.resolve("field_9999")

    def test_disabled_field_rejected(self):
        self.page.locator("#name").evaluate(
            "element => element.disabled = true"
        )

        with self.assertRaises(FieldRegistryError):
            self.registry.resolve("field_0001")

    def test_detached_field_rejected(self):
        self.page.locator("#name").evaluate(
            "element => element.remove()"
        )

        with self.assertRaises(Exception):
            self.registry.resolve("field_0001")
    def test_reordered_fields_rejected(self):
        self.page.locator("body").evaluate("""
            body => {
                const name = document.querySelector("#name");
                const dob = document.querySelector("#dob");
                name.before(dob);
            }
        """)

        with self.assertRaises(FieldRegistryError):
            self.registry.resolve("field_0001")

    def test_replaced_field_with_different_metadata_rejected(self):
        self.page.locator("#name").evaluate("""
            element => {
                const replacement = element.cloneNode(false);
                replacement.id = "different_name";
                element.replaceWith(replacement);
            }
        """)

        with self.assertRaises(FieldRegistryError):
            self.registry.resolve("field_0001")


if __name__ == "__main__":
    unittest.main()