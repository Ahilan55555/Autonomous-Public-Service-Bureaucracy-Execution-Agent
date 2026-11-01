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
        print("URL:", page.url)
        print("Title:", page.title())

        # STEP 2: CLOSE POPUP
        close_mobile_popup(page)

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

        print("[OK] Registration entered locally.")

        # STEP 4: ENSURE POPUP IS CLOSED
        close_mobile_popup(page)

        # STEP 5: ACCEPT PRIVACY NOTICE
        accept_privacy_notice(page)

        # STEP 6: CHECK FORM
        print("\n=== HOMEPAGE STATUS ===")

        print(
            "Registration:",
            registration_field.input_value()
        )

        print(
            "Privacy accepted:",
            page.locator(
                "#homepageformid input[type='checkbox']"
            ).first.is_checked()
        )

        print(
            "State dropdown disabled:",
            page.locator("#state_cd_input").is_disabled()
        )

        print(
            "RTO dropdown disabled:",
            page.locator("#fit_c_office_to_input").is_disabled()
        )

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

        # STEP 9: HUMAN REVIEW
        confirm = input(
            "\nReview the browser. Continue? (yes/no): "
        ).strip().lower()

        if confirm != "yes":
            print("[STOP] Cancelled.")
            return

        final_confirm = input(
            "\nProceed to the next VAHAN page? (yes/no): "
        ).strip().lower()

        if final_confirm != "yes":
            print("[STOP] Navigation cancelled.")
            return

        # STEP 10: CLICK PROCEED
        button.click(timeout=15000)

        print("\n[INFO] Proceed clicked.")

        # STEP 11: WAIT FOR PORTAL RESPONSE
        page.wait_for_timeout(5000)

        print("\n=== NEXT PAGE ===")
        print("URL:", page.url)
        print("Title:", page.title())

        # STEP 12: EXTRACT PAGE TEXT
        print("\n=== PAGE CONTENT ===")

        page_text = page.locator("body").inner_text()

        print(page_text[:7000])

        # STEP 13: EXTRACT VISIBLE FORM FIELDS
        print("\n=== VISIBLE FORM FIELDS ===")

        fields = page.locator(
            "input:visible, select:visible, textarea:visible"
        ).evaluate_all("""
            elements => elements.map(element => ({
                tag: element.tagName,
                type: element.type,
                id: element.id,
                name: element.name,
                placeholder: element.placeholder,
                disabled: element.disabled
            }))
        """)

        for field in fields:
            print(field)

        input("\nPress ENTER to close browser...")

    except KeyboardInterrupt:
        print("\n[STOP] Interrupted by user.")

    except Exception as error:
        print(
            f"\n[ERROR] {type(error).__name__}: {error}"
        )

    finally:
        try:
            observer.close()
            print("[INFO] Browser closed.")
        except Exception:
            pass


if __name__ == "__main__":
    main()