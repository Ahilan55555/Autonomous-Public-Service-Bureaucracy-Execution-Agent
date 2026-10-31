from playwright.sync_api import sync_playwright

from browser_agent.perception.dom_extractor import extract_dom


html = """
<html>
<head>
    <title>Government Application</title>
</head>

<body>

    <h1>Income Certificate Application</h1>

    <form>

        <label>Name</label>
        <input type="text" name="name" placeholder="Enter name">

        <label>Date of Birth</label>
        <input type="date" name="dob">

        <label>Password</label>
        <input type="password" name="password">

        <label>OTP</label>
        <input type="text" name="otp">

        <button type="submit">Submit</button>

    </form>

</body>
</html>
"""


with sync_playwright() as p:

    browser = p.chromium.launch(headless=True)

    page = browser.new_page()

    page.set_content(html)

    observation = extract_dom(page)

    print("\nExtracted webpage:")
    print(observation)

    browser.close()