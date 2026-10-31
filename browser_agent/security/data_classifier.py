import re


# Authentication-related fields
AUTHENTICATION_KEYWORDS = {
    "password",
    "passwd",
    "pwd",
    "otp",
    "one_time_password",
    "verification_code",
    "security_code",
    "captcha",
    "token",
    "secret",
    "session",
}

# Confidential financial and identity fields
CONFIDENTIAL_KEYWORDS = {
    "aadhaar",
    "aadhar",
    "pan_number",
    "pan_card",
    "passport",
    "account_number",
    "bank_account",
    "ifsc",
    "credit_card",
    "debit_card",
    "identity_number",
    "national_id",
}

# Personal information
PERSONAL_KEYWORDS = {
    "name",
    "full_name",
    "first_name",
    "last_name",
    "dob",
    "date_of_birth",
    "birth_date",
    "address",
    "phone",
    "mobile",
    "email",
    "age",
}


def normalize(value):
    """Normalize field metadata for classification."""

    if not value:
        return ""

    return re.sub(
        r"[^a-z0-9]+",
        "_",
        str(value).lower()
    ).strip("_")


def classify_field(field):
    """
    Classify a webpage form field using metadata only.

    Never inspect the actual field value.
    """

    field_type = normalize(field.get("type"))
    
    metadata = " ".join([
        normalize(field.get("name")),
        normalize(field.get("id")),
        normalize(field.get("label")),
        normalize(field.get("placeholder")),
        normalize(field.get("autocomplete")),
    ])

    # File contents must never be sent to Gemini.
    if field_type in {"password", "file", "hidden"}:
        return "NEVER_SEND"

    if any(keyword in metadata for keyword in AUTHENTICATION_KEYWORDS):
        return "NEVER_SEND"

    if any(keyword in metadata for keyword in CONFIDENTIAL_KEYWORDS):
        return "CONFIDENTIAL"

    if any(keyword in metadata for keyword in PERSONAL_KEYWORDS):
        return "PERSONAL"

    return "PUBLIC"


def classify_observation(observation):
    """
    Add classifications to extracted form fields.
    """

    classified = []

    for field in observation.get("input_fields", []):

        result = field.copy()

        result["classification"] = classify_field(field)

        classified.append(result)

    return classified