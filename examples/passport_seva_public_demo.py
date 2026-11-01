"""Read-only observation of Passport Seva's public homepage."""

import os
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

# Show the public page by default; BROWSER_HEADLESS=true remains an override.
os.environ.setdefault("BROWSER_HEADLESS", "false")

from browser_agent.perception.observer import BrowserObserver
from browser_agent.security.outbound_policy import build_outbound_payload
from browser_agent.security.sanitizer import sanitize_observation, sanitize_text


TARGET_URL = "https://www.passportindia.gov.in/"
ALLOWED_DOMAINS = ["passportindia.gov.in"]
PUBLIC_GUIDANCE_PAGES = [
    ("Getting started", "https://www.passportindia.gov.in/psp/GettingStarted"),
    ("Document guidance", "https://www.passportindia.gov.in/psp/ListDocuments"),
]


def public_url(url):
    """Remove query strings and fragments before displaying a URL."""

    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))


def public_content_lines(page, limit=14):
    """Return a short, sanitized sample of visible public page text."""

    navigation_labels = {
        "skip to main content |screen reader access |sitemap |",
        "a-aa+",
        "hindi",
        "passport seva",
        "ministry of external affairs, government of india",
        "home",
        "about us",
        "passport offices",
        "services",
        "useful links",
        "contact us",
        "login",
        "register",
    }
    text = page.locator("body").inner_text(timeout=10000)
    lines = []
    for raw_line in text.splitlines():
        line = " ".join(raw_line.split())
        if not line:
            continue
        normalized = line.lower()
        if normalized in navigation_labels:
            continue
        if normalized.startswith(("sunday,", "national call center:")):
            continue
        safe_line = sanitize_text(line)
        if safe_line and safe_line not in lines:
            lines.append(safe_line)
        if len(lines) >= limit:
            break
    return lines


def main():
    observer = BrowserObserver(allowed_domains=ALLOWED_DOMAINS)

    try:
        page = observer.start()
        result = observer.navigate(TARGET_URL)
        page.wait_for_load_state("domcontentloaded", timeout=30000)
        page.wait_for_timeout(5000)

        print("Passport Seva public guidance tour")
        print("Homepage navigation:", result["status"])

        services_link = page.get_by_role(
            "link",
            name="Services",
            exact=True,
        )
        if services_link.count() == 0:
            raise RuntimeError("The public Services link was not found.")

        services_link.first.click(timeout=10000)
        page.wait_for_load_state("domcontentloaded", timeout=30000)
        page.wait_for_timeout(1500)
        print("Clicked the public Services navigation link.")
        print("Services page:", public_url(page.url))

        for page_name, target_url in PUBLIC_GUIDANCE_PAGES:
            navigation = observer.navigate(target_url)
            page.wait_for_load_state("domcontentloaded", timeout=30000)
            page.wait_for_timeout(3000)

            observation = observer.observe()
            safe_observation = sanitize_observation(observation)
            outbound = build_outbound_payload(safe_observation)

            print(f"\n=== {page_name} ===")
            print("Page:", public_url(page.url))
            print("Title:", safe_observation.get("title", ""))
            print("Public content found:")
            for line in public_content_lines(page):
                print(" -", line)

            public_links = [
                link["text"]
                for link in outbound.get("links", [])
                if link.get("visible") and link.get("text")
                and link["text"].strip().lower() not in {
                    "login", "register", "click here", "know more",
                    "home", "contact us",
                }
            ]
            if public_links:
                print("Public links:", ", ".join(public_links[:12]))

        print("\nOnly the public Services navigation link was clicked.")
        print("No application, login, or registration links were followed.")
        print("No forms were filled or submitted.")
        print("No account details were requested and no Gemini request was made.")
        input("Press ENTER to close the browser...")

    except KeyboardInterrupt:
        print("\n[STOP] Inspection interrupted.")
    except Exception as error:
        print("\n[ERROR] Public-page inspection failed:", type(error).__name__)
    finally:
        observer.close()
        print("[INFO] Browser closed.")


if __name__ == "__main__":
    main()
