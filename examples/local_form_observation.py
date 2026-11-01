from browser_agent.perception.observer import BrowserObserver
from browser_agent.security.data_classifier import classify_observation
from browser_agent.security.sanitizer import sanitize_observation
from browser_agent.security.outbound_policy import (
    build_outbound_payload,
    OutboundPolicyError,
)
from copy import deepcopy



observer = BrowserObserver(
    allowed_domains=["127.0.0.1"]
)

observer.ignore_https_errors = True

try:
    page = observer.start()

    result = observer.navigate(
        "https://127.0.0.1:8000/tests/fixtures/browser_observation.html"
    )

    print("\nNAVIGATION")
    print(result)

    page.wait_for_timeout(1000)
    # Insert dummy values locally to test that values never enter observations.
    page.locator("#name").fill("TEST_PERSONAL_NAME_123")
    page.locator("#email").fill("test_private@example.invalid")
    page.locator("#password").fill("TEST_PASSWORD_456")
    page.locator("#otp").fill("TEST_OTP_789")

    observation = observer.observe()
    

    # Classify fields using metadata only.
    classified_fields = classify_observation(observation)

    print("\nFIELD CLASSIFICATIONS")

    for field in classified_fields:
        print(field["field_ref"], "->", field["classification"])

    # Build sanitized observation.
    sanitized = sanitize_observation(observation)

    # Validate and construct the final Gemini payload.
    payload = build_outbound_payload(sanitized)

    print("\nVALIDATED OUTBOUND PAYLOAD")
    print(payload)

    print("\nOUTBOUND SECURITY TESTS")

    assert "security" not in payload
    assert len(payload["input_fields"]) == 2

    assert all(
        field["type"] not in {"password", "file", "hidden"}
        for field in payload["input_fields"]
    )

    payload_text = str(payload)

    assert "TEST_PERSONAL_NAME_123" not in payload_text
    assert "test_private@example.invalid" not in payload_text
    assert "TEST_PASSWORD_456" not in payload_text
    assert "TEST_OTP_789" not in payload_text

    print("PASS: Sanitized payload accepted.")
    print("PASS: Security metadata excluded.")
    print("PASS: Sensitive fields excluded.")
    print("PASS: Dummy values excluded.")

    print("\nSANITIZED OBSERVATION")
    print(sanitized)

    # Privacy assertions.
    payload_text = str(sanitized)

    assert "field_0001" in payload_text
    assert "field_0002" in payload_text

    assert "field_0003" not in payload_text
    assert "field_0004" not in payload_text

    

    assert sanitized["security"]["personal_values_included"] is False
    assert sanitized["security"]["authentication_values_included"] is False
    assert sanitized["security"]["confidential_values_included"] is False

    print("\nSUCCESS: Privacy assertions passed.")

    print("\nOBSERVATION")
    print("Title:", observation["title"])

    print("\nHEADINGS")

    def must_reject(name, test_payload):
        try:
            build_outbound_payload(test_payload)
        except OutboundPolicyError:
            print(f"PASS: Rejected {name}")
        else:
            raise AssertionError(f"FAIL: Accepted {name}")


    print("\nMALICIOUS PAYLOAD TESTS")

    # Unexpected key
    bad_payload = deepcopy(sanitized)
    bad_payload["personal_data"] = "secret"
    must_reject("unexpected key", bad_payload)

    # Duplicate field reference
    bad_payload = deepcopy(sanitized)
    bad_payload["input_fields"].append(
        deepcopy(bad_payload["input_fields"][0])
    )
    must_reject("duplicate field reference", bad_payload)

    # Forbidden password type
    bad_payload = deepcopy(sanitized)
    bad_payload["input_fields"][0]["type"] = "password"
    must_reject("password input type", bad_payload)

    # Recognizable email pattern
    bad_payload = deepcopy(sanitized)
    bad_payload["title"] = "Contact test@example.com"
    must_reject("email pattern", bad_payload)

    print("ALL MALICIOUS PAYLOAD TESTS PASSED")
    
    for heading in observation["headings"]:
        print(heading)

    print("\nBUTTONS")
    for button in observation["buttons"]:
        print(button)

    print("\nLINKS")
    for link in observation["links"]:
        print(link)

    print("\nINPUT FIELDS")
    for field in observation["input_fields"]:
        print(field)

finally:
    observer.close()