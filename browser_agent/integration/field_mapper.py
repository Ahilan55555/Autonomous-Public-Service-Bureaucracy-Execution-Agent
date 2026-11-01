"""Privacy-safe field mapping proposal validation."""

import json


class FieldMappingError(ValueError):
    pass


def build_mapping_prompt(safe_request, sanitized_observation):
    """Build a Gemini prompt without applicant values or document URLs."""

    if not isinstance(safe_request, dict):
        raise FieldMappingError("safe_request must be a dictionary")

    if not isinstance(sanitized_observation, dict):
        raise FieldMappingError("sanitized_observation must be a dictionary")

    field_names = safe_request.get("form_field_names", [])
    if not isinstance(field_names, list):
        raise FieldMappingError("form_field_names must be a list")

    # Only include explicitly selected, sanitized webpage information.
    allowed_page_keys = (
        "url",
        "title",
        "headings",
        "buttons",
        "links",
        "input_fields",
    )

    safe_page = {
        key: sanitized_observation.get(key)
        for key in allowed_page_keys
        if key in sanitized_observation
    }

    return f"""
You are proposing field mappings for a government-service form.

Service:
{safe_request.get("service_name", "")}

Expected application field names:
{json.dumps(field_names)}

Sanitized webpage observation:
{json.dumps(safe_page, ensure_ascii=False)}

Return ONLY valid JSON in this format:
{{
  "mappings": [
    {{
      "request_field": "full_name",
      "visible_field": "Applicant Name",
      "confidence": 0.95,
      "reason": "Both refer to the applicant's full name."
    }}
  ]
}}

Rules:
- Map only fields that are actually visible in the observation.
- Do not invent fields or selectors.
- Do not return personal values.
- Do not return passwords, OTPs, tokens, or document URLs.
- Use confidence between 0 and 1.
- If no reliable mapping exists, return an empty mappings list.
- This is a proposal only. Do not perform browser actions.
"""


def validate_mapping(response, expected_fields, visible_fields):
    """Reject mappings that reference unknown request or page fields."""

    if not isinstance(response, dict):
        raise FieldMappingError("Gemini response must be a JSON object")

    mappings = response.get("mappings")
    if not isinstance(mappings, list):
        raise FieldMappingError("'mappings' must be a list")

    expected = set(expected_fields)
    visible = set(visible_fields)
    validated = []
    used_request_fields = set()

    for item in mappings:
        if not isinstance(item, dict):
            raise FieldMappingError("Each mapping must be an object")

        request_field = item.get("request_field")
        visible_field = item.get("visible_field")
        confidence = item.get("confidence")

        if request_field not in expected:
            raise FieldMappingError(
                f"Unknown request field: {request_field}"
            )

        if visible_field not in visible:
            raise FieldMappingError(
                f"Field is not visible on the page: {visible_field}"
            )

        if request_field in used_request_fields:
            raise FieldMappingError(
                f"Duplicate mapping for: {request_field}"
            )

        if (
            isinstance(confidence, bool)
            or not isinstance(confidence, (int, float))
            or not 0 <= confidence <= 1
        ):
            raise FieldMappingError("Confidence must be between 0 and 1")

        used_request_fields.add(request_field)

        validated.append({
            "request_field": request_field,
            "visible_field": visible_field,
            "confidence": float(confidence),
            "reason": str(item.get("reason", ""))[:300],
            "requires_human_approval": True,
        })

    return validated