class ValueProviderError(Exception):
    """Raised when a local value cannot be safely resolved."""
    pass


class LocalValueProvider:
    """
    Provides explicitly approved local values to trusted execution code.

    Actual values must never be included in LLM prompts or audit logs.
    """

    ALLOWED_REFERENCES = {
        "applicant_name",
        "date_of_birth",
        "email",
        "phone",
        "address",
    }

    def __init__(self, values=None, approved_references=None):

        if values is None:
            values = {}

        if approved_references is None:
            approved_references = set()

        if not isinstance(values, dict):
            raise ValueError("Values must be a dictionary")

        if not isinstance(approved_references, (set, list, tuple)):
            raise ValueError("Approved references must be a collection")

        self._values = values.copy()
        self._approved_references = set(approved_references)

        if not self._approved_references.issubset(
            self.ALLOWED_REFERENCES
        ):
            raise ValueProviderError(
                "Unknown or forbidden value reference"
            )

        if not set(self._values).issubset(self.ALLOWED_REFERENCES):
            raise ValueProviderError(
                "Unsupported local value reference"
            )

    def resolve(self, reference):

        if not isinstance(reference, str):
            raise ValueProviderError("Reference must be a string")

        if reference not in self.ALLOWED_REFERENCES:
            raise ValueProviderError("Reference is not permitted")

        if reference not in self._approved_references:
            raise ValueProviderError(
                "User approval is required for this reference"
            )

        if reference not in self._values:
            raise ValueProviderError(
                "Requested local value is unavailable"
            )

        value = self._values[reference]

        if not isinstance(value, str) or not value.strip():
            raise ValueProviderError(
                "Local value must be a non-empty string"
            )

        return value