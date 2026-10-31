import re

from browser_agent.security.data_classifier import (
    classify_field
)


# Additional defense against accidentally exposed identifiers.
SENSITIVE_PATTERNS = [

    # Indian Aadhaar-like 12-digit identifiers
    re.compile(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b"),

    # Indian PAN-like identifiers
    re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b", re.IGNORECASE),

    # Email addresses
    re.compile(
        r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b",
        re.IGNORECASE
    ),

    # Phone numbers
    re.compile(r"\b(?:\+91[\s-]?)?[6-9]\d{9}\b"),
]


def sanitize_text(text):

    if not isinstance(text, str):
        return ""

    sanitized = text

    for pattern in SENSITIVE_PATTERNS:
        sanitized = pattern.sub("[REDACTED]", sanitized)

    return sanitized[:500]


def sanitize_observation(observation):
    """
    Create a restricted observation for external LLM use.

    Input field values are never included.
    Sensitive field metadata is not exposed.
    """

    safe_fields = []

    for field in observation.get("input_fields", []):

        classification = classify_field(field)

        if classification != "PUBLIC":
            continue

        safe_fields.append({
            "type": field.get("type", "text"),
            "required": bool(field.get("required", False)),
            "disabled": bool(field.get("disabled", False))
        })

    return {

        "title": sanitize_text(
            observation.get("title", "")
        ),

        "headings": [
            sanitize_text(item)
            for item in observation.get("headings", [])
            if isinstance(item, str)
        ][:30],

        "buttons": [
            {
                "text": sanitize_text(button.get("text", "")),
                "disabled": bool(button.get("disabled", False))
            }
            for button in observation.get("buttons", [])
        ][:50],

        "links": [
            {
                "text": sanitize_text(link.get("text", "")),
                "visible": bool(link.get("visible", False))
            }
            for link in observation.get("links", [])
        ][:50],

        "input_fields": safe_fields,

        "security": {
            "personal_values_included": False,
            "confidential_values_included": False,
            "authentication_values_included": False
        }
    }