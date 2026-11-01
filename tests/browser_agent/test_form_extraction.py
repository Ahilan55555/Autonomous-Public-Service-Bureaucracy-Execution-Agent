import unittest

from playwright.sync_api import sync_playwright

from browser_agent.perception.dom_extractor import extract_dom
from browser_agent.security.data_classifier import classify_field


HTML = """
<html>
<head>
    <title>Government Application</title>
</head>
<body>
    <h1>Income Certificate Application</h1>

    <form>
        <label for="applicant_name">Applicant Name</label>
        <input
            type="text"
            id="applicant_name"
            name="applicant_name"
            autocomplete="name"
            value="Test Person"
        >

        <label for="dob">Date of Birth</label>
        <input
            type="date"
            id="dob"
            name="dob"
            autocomplete="bday"
        >

        <label for="password">Password</label>
        <input
            type="password"
            id="password"
            name="password"
        >

        <label for="otp">OTP</label>
        <input
            type="text"
            id="otp"
            name="otp"
            autocomplete="one-time-code"
        >

        <button type="submit">Submit</button>
    </form>
</body>
</html>
"""


class FormExtractionTests(unittest.TestCase):

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
        self.observation = extract_dom(self.page)

    def tearDown(self):
        self.page.close()

    def test_field_labels_are_extracted(self):
        fields = self.observation["input_fields"]

        self.assertEqual(fields[0]["label"], "Applicant Name")
        self.assertEqual(fields[1]["label"], "Date of Birth")

    def test_autocomplete_is_extracted(self):
        fields = self.observation["input_fields"]

        self.assertEqual(fields[0]["autocomplete"], "name")
        self.assertEqual(fields[1]["autocomplete"], "bday")
        self.assertEqual(
            fields[3]["autocomplete"],
            "one-time-code"
        )

    def test_password_and_otp_metadata_are_extracted(self):
        fields = self.observation["input_fields"]

        self.assertEqual(fields[2]["type"], "password")
        self.assertEqual(fields[3]["name"], "otp")

    def test_sensitive_fields_are_classified(self):
        fields = self.observation["input_fields"]

        classifications = [
            classify_field(field)
            for field in fields
        ]

        self.assertEqual(classifications[0], "PERSONAL")
        self.assertEqual(classifications[1], "PERSONAL")
        self.assertEqual(classifications[2], "NEVER_SEND")
        self.assertEqual(classifications[3], "NEVER_SEND")

    def test_actual_values_are_not_extracted(self):
        fields = self.observation["input_fields"]

        for field in fields:
            self.assertNotIn("value", field)

        self.assertNotIn("Test Person", str(self.observation))

    def test_field_references_are_generated(self):
        fields = self.observation["input_fields"]

        self.assertEqual(
            [field["field_ref"] for field in fields],
            [
                "field_0001",
                "field_0002",
                "field_0003",
                "field_0004",
            ]
        )

    def test_field_references_are_unique(self):
        fields = self.observation["input_fields"]

        references = [
            field["field_ref"]
            for field in fields
        ]

        self.assertEqual(
            len(references),
            len(set(references))
        )
if __name__ == "__main__":
    unittest.main()