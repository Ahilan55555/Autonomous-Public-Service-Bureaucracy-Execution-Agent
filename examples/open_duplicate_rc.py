import os
import re
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

# This live demo should be visible unless the caller explicitly opts into
# headless mode.
os.environ.setdefault("BROWSER_HEADLESS", "false")

from browser_agent.perception.observer import BrowserObserver

URL = "https://vahan.parivahan.gov.in/vahanservice/vahan/"


def close_mobile_popup(page):
    """Close the mobile update popup if it appears."""

    modal = page.locator("#updatemobileno")

    try:
        modal.wait_for(state="visible", timeout=5000)

        print("[INFO] Mobile popup detected.")

        modal.get_by_role(
            "button",
            name="Close",
            exact=True
        ).click(timeout=10000)

        modal.wait_for(state="hidden", timeout=15000)

        print("[OK] Mobile popup closed.")

    except Exception as error:
        if modal.is_visible():
            raise RuntimeError(
                f"Could not close mobile popup: {error}"
            ) from error

        print("[INFO] No visible mobile popup.")


def close_authentication_modes_notice(page):
    """Dismiss the portal's informational authentication notice."""

    for dialog in page.get_by_role("dialog").all():
        try:
            if not dialog.is_visible():
                continue

            if "authentication modes" not in dialog.inner_text().lower():
                continue

            close_button = dialog.locator(".ui-dialog-titlebar-close")
            if close_button.count() == 0:
                raise RuntimeError(
                    "Authentication notice has no close control."
                )

            close_button.click(timeout=5000)
            dialog.wait_for(state="hidden", timeout=10000)
            print("[OK] Authentication information notice closed.")
            return

        except Exception as error:
            if "authentication modes" in dialog.inner_text().lower():
                raise RuntimeError(
                    f"Could not close authentication notice: {error}"
                ) from error

    print("[INFO] No authentication information notice is open.")


def registration_rto_code(registration):
    """Return the state and RTO code encoded in a standard plate number."""

    normalized = re.sub(r"[\s-]", "", registration.upper())
    match = re.match(r"^([A-Z]{2})(\d{1,2})", normalized)
    if not match:
        raise ValueError(
            "Could not read a state and RTO code from that registration."
        )

    return match.group(1), int(match.group(2))


def select_rto_from_registration(page, registration):
    """Select an unambiguous RTO option matching the plate prefix."""

    state_code, rto_number = registration_rto_code(registration)
    rto_select = page.locator("#fit_c_office_to_input")

    try:
        page.wait_for_function(
            "state => { const el = document.querySelector('#state_cd_input'); "
            "return el && el.value === state; }",
            arg=state_code,
            timeout=12000,
        )
    except Exception as error:
        raise RuntimeError(
            "VAHAN did not resolve the registration to its state. "
            "The registration may be mistyped or unsupported."
        ) from error

    options = rto_select.locator("option").evaluate_all(
        "items => items.map(item => ({value: item.value, "
        "label: (item.textContent || '').trim()}))"
    )

    def matches_rto(label):
        digits = re.findall(r"(?<!\d)0*(\d{1,2})(?!\d)", label)
        return any(int(token) == rto_number for token in digits)

    matches = [
        option for option in options
        if option["value"] != "-1" and matches_rto(option["label"])
    ]

    if len(matches) != 1:
        available = [option["label"] for option in options if option["value"] != "-1"]
        if available:
            raise RuntimeError(
                "Could not match the plate's RTO code to exactly one portal "
                "option. Available RTO labels: " + ", ".join(available)
            )
        raise RuntimeError(
            "VAHAN has not loaded RTO options for this registration. "
            "The browser is being left open for review."
        )

    selected = matches[0]
    menu = page.locator("#fit_c_office_to")
    if "ui-state-disabled" in (menu.get_attribute("class") or ""):
        raise RuntimeError(
            "VAHAN has not enabled RTO selection for this registration."
        )

    menu.click(timeout=10000)
    panel = page.locator("#fit_c_office_to_panel")
    panel.wait_for(state="visible", timeout=10000)

    items = panel.locator(".ui-selectonemenu-item")
    chosen_item = None
    for index in range(items.count()):
        item = items.nth(index)
        label = (item.get_attribute("data-label") or item.inner_text()).strip()
        if label == selected["label"]:
            chosen_item = item
            break

    if chosen_item is None:
        raise RuntimeError(
            "The matching RTO is present in the page data but not in the "
            "visible selection list."
        )

    chosen_item.click(timeout=10000)
    page.wait_for_timeout(1000)

    selected_label = page.locator("#fit_c_office_to_label").inner_text().strip()
    if selected_label != selected["label"]:
        raise RuntimeError("VAHAN did not confirm the selected RTO.")

    print("[OK] Matching registering authority selected.")


def accept_privacy_notice(page):
    """Accept the privacy checkbox."""

    modal = page.locator("#updatemobileno")

    if modal.is_visible():
        raise RuntimeError("Mobile popup is still open.")

    checkboxes = page.locator(
        "#homepageformid input[type='checkbox']"
    )

    if checkboxes.count() != 1:
        raise RuntimeError(
            f"Expected one checkbox, found {checkboxes.count()}."
        )

    checkbox = checkboxes.first

    if not checkbox.is_checked():

        component = checkbox.locator(
            "xpath=ancestor::div[contains("
            "concat(' ', normalize-space(@class), ' '),"
            " ' ui-chkbox ')]"
        )

        component.locator(".ui-chkbox-box").click(
            timeout=10000
        )

    if not checkbox.is_checked():
        raise RuntimeError("Privacy checkbox selection failed.")

    print("[OK] Privacy notice accepted.")


def button_is_clickable(page, button):
    """
    Check whether the Proceed button or one of its
    child elements receives the click at its centre.
    """

    return button.evaluate("""
        button => {
            const rect = button.getBoundingClientRect();

            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            const top = document.elementFromPoint(x, y);

            return top === button || button.contains(top);
        }
    """)


def main():

    observer = BrowserObserver(
        allowed_domains=[
            "parivahan.gov.in",
            "vahan.parivahan.gov.in"
        ]
    )

    try:

        # STEP 1: START BROWSER
        page = observer.start()

        navigation = observer.navigate(URL)

        print("\nNavigation:", navigation)

        page.wait_for_load_state(
            "domcontentloaded",
            timeout=30000
        )

        page.wait_for_timeout(3000)

        print("\n=== VAHAN DUPLICATE RC ===")
        print("Title:", page.title())

        # STEP 2: CLOSE POPUP
        close_mobile_popup(page)
        close_authentication_modes_notice(page)

        # STEP 3: ENTER REGISTRATION NUMBER
        registration_field = page.locator("#regnid")

        registration_field.wait_for(
            state="visible",
            timeout=15000
        )

        registration = input(
            "\nEnter an authorized vehicle registration number: "
        ).strip().upper()

        if not registration:
            print("[STOP] Registration number is required.")
            return

        registration_field.fill(registration)
        registration_field.press("Tab")

        print("[OK] Registration entered locally; the value will not be logged.")

        # STEP 4: RESOLVE THE MATCHING REGISTERING AUTHORITY
        close_mobile_popup(page)
        close_authentication_modes_notice(page)
        select_rto_from_registration(page, registration)

        # STEP 5: GET THE APPLICANT'S CONSENT BEFORE ACCEPTING PORTAL TERMS.
        print(
            "\nReview the VAHAN privacy notice in the browser. "
            "This consent must come from you, the applicant."
        )
        consent = input(
            "Type YES if you accept the portal terms and authorize this lookup: "
        ).strip()
        if consent != "YES":
            print("[STOP] Consent was not given; no lookup was started.")
            return

        # STEP 6: ACCEPT PRIVACY NOTICE
        accept_privacy_notice(page)

        # STEP 7: PREPARE PROCEED BUTTON
        button = page.locator("#proccedHomeButtonId")

        button.wait_for(
            state="visible",
            timeout=15000
        )

        button.scroll_into_view_if_needed()

        page.wait_for_timeout(1000)

        print("\n=== PROCEED BUTTON ===")
        print("Visible:", button.is_visible())
        print("Enabled:", button.is_enabled())

        if not button.is_enabled():
            raise RuntimeError("Proceed button is disabled.")

        # STEP 8: CHECK CLICKABILITY
        if not button_is_clickable(page, button):
            print("[STOP] Another element covers Proceed.")
            input("Press ENTER to close browser...")
            return

        print("[OK] Proceed button is unobstructed.")

        # STEP 8: START THE USER-AUTHORIZED LOOKUP
        button.click(timeout=15000)

        print("\n[INFO] Proceed clicked.")

        # STEP 11: WAIT FOR PORTAL RESPONSE
        page.wait_for_timeout(5000)

        print("\n=== NEXT PAGE ===")
        print("Title:", page.title())

        otp_fields = page.locator(
            "input[autocomplete='one-time-code'], "
            "input[id*='otp' i], input[name*='otp' i]"
        )
        if otp_fields.count():
            print(
                "\n[PAUSE] The portal is requesting authentication. "
                "Complete sign-in and OTP directly in the browser."
            )

        print(
            "\nThe browser is open for you to review the portal state. "
            "No application was submitted and no payment was made."
        )
        input("Press ENTER when you are ready to close the browser...")

    except KeyboardInterrupt:
        print("\n[STOP] Interrupted by user.")

    except Exception as error:
        print(
            f"\n[ERROR] {type(error).__name__}: {error}"
        )
        if observer.page is not None and not observer.page.is_closed():
            input("Review the open browser, then press ENTER to close it...")

    finally:
        try:
            observer.close()
            print("[INFO] Browser closed.")
        except Exception:
            pass


if __name__ == "__main__":
    main()
