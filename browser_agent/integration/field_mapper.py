"""Field mapping using sanitized webpage labels."""

import json


class FieldMappingError(ValueError):
    pass


def build_mapping_prompt(safe_request, sanitized_observation, field_labels=None):
    if not isinstance(safe_request, dict):
        raise FieldMappingError("Invalid service request")

    if not isinstance(sanitized_observation, dict):
        raise FieldMappingError("Invalid webpage observation")

    field_names = safe_request.get("form_field_names", [])
    field_labels = field_labels or []

    return f"""
You are mapping a government application form.

SERVICE:
{safe_request.get("service_name", "")}

EXPECTED REQUEST FIELD NAMES:
{json.dumps(field_names)}

SANITIZED PAGE INFORMATION:
{json.dumps(sanitized_observation, ensure_ascii=False)}

VISIBLE FIELD LABELS:
{json.dumps(field_labels, ensure_ascii=False)}

Return ONLY JSON:
{{
  "mappings": [
    {{
      "request_field": "registration_number",
      "visible_field": "field_0001",
      "confidence": 0.95,
      "reason": "The visible label identifies the registration number."
    }}
  ]
}}

RULES:
- visible_field MUST be one of the supplied field references.
- Match based on field labels and page context.
- Do not invent fields.
- Do not return actual personal values.
- Do not fill fields or submit the application.
- If uncertain, return an empty mappings list.
"""


def validate_mapping(response, expected_fields, visible_fields):
    if not isinstance(response, dict):
        raise FieldMappingError("Response must be a JSON object")

    mappings = response.get("mappings")

    if not isinstance(mappings, list):
        raise FieldMappingError("mappings must be a list")

    expected = set(expected_fields)
    visible = set(visible_fields)
    used = set()
    validated = []

    for item in mappings:
        if not isinstance(item, dict):
            raise FieldMappingError("Invalid mapping entry")

        request_field = item.get("request_field")
        visible_field = item.get("visible_field")
        confidence = item.get("confidence")

        if request_field not in expected:
            raise FieldMappingError("Unknown request field")

        if visible_field not in visible:
            raise FieldMappingError("Unknown visible field reference")

        if request_field in used:
            raise FieldMappingError("Duplicate request field mapping")

        if (
            isinstance(confidence, bool)
            or not isinstance(confidence, (int, float))
            or not 0 <= confidence <= 1
        ):
            raise FieldMappingError("Invalid confidence")

        used.add(request_field)

        validated.append({
            "request_field": request_field,
            "visible_field": visible_field,
            "confidence": float(confidence),
            "reason": str(item.get("reason", ""))[:300],
            "requires_human_approval": True,
        })

    return validated
