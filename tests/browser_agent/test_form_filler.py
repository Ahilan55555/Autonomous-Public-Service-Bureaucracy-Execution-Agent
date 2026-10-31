import unittest

from playwright.sync_api import sync_playwright

from browser_agent.perception.dom_extractor import extract_dom
from browser_agent.execution.field_registry import FieldRegistry
from browser_agent.execution.value_provider import LocalValueProvider
from browser_agent.execution.form_filler import (
    FormFiller,
    FormFillerError,
)


HTML = """
<html>
<body>
    <label for="name">Applicant Name</label>
    <input id="name" type="text">

    <label for="dob">Date of Birth</label>
    <input id="dob" type="date">

    <label for="password">Password</label>
    <input id="password" type="password">
</body>
</html>
"""


class FormFillerTests(unittest.TestCase):

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

        self.provider = LocalValueProvider(
            values={
                "applicant_name": "Example Person",
                "date_of_birth": "2005-05-15",
            },
            approved_references={
                "applicant_name",
                "date_of_birth",
            },
        )

        self.filler = FormFiller(
            self.registry,
            self.provider
        )

    def tearDown(self):
        self.page.close()

    def test_fill_text_field(self):
        result = self.filler.fill(
            "field_0001",
            "applicant_name"
        )

        self.assertEqual(result["status"], "filled")
        self.assertEqual(
            self.page.locator("#name").input_value(),
            "Example Person"
        )

    def test_fill_date_field(self):
        self.filler.fill(
            "field_0002",
            "date_of_birth"
        )

        self.assertEqual(
            self.page.locator("#dob").input_value(),
            "2005-05-15"
        )

    def test_unapproved_value_rejected(self):
        with self.assertRaises(FormFillerError):
            self.filler.fill(
                "field_0001",
                "email"
            )

    def test_password_field_rejected(self):
        with self.assertRaises(FormFillerError):
            self.filler.fill(
                "field_0003",
                "applicant_name"
            )

    def test_unknown_field_rejected(self):
        with self.assertRaises(FormFillerError):
            self.filler.fill(
                "field_9999",
                "applicant_name"
            )


if __name__ == "__main__":
    unittest.main()