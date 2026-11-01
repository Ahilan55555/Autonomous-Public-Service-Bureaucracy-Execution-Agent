import time
import logging
import asyncio
import threading
from typing import Optional, Type, Any, List
from google import genai
from google.genai import types
from google.genai.errors import APIError
from pydantic import BaseModel
from app.config import settings

logger = logging.getLogger("agent.pipeline")

GEMINI_REQUEST_TIMEOUT_SECONDS = 5
GEMINI_TOTAL_TIMEOUT_SECONDS = 12

# Canonical production model identifiers supported by the Gemini Developer API.
PRIORITY_MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
]


class GeminiFastClient:
    def __init__(self):
        raw_keys = getattr(settings, "GEMINI_API_KEYS", "") or getattr(settings, "GEMINI_API_KEY", "") or ""
        self.api_keys: List[str] = [k.strip() for k in str(raw_keys).split(",") if k.strip()]

        if not self.api_keys:
            import os
            for i in range(1, 10):
                k = os.getenv(f"GEMINI_API_KEY_{i}")
                if k and k.strip():
                    self.api_keys.append(k.strip())

        self.current_key_idx = 0
        self.total_keys = len(self.api_keys)
        self._rotation_lock = threading.Lock()

        if self.total_keys > 0:
            masked = self._get_masked_key(self.current_key_idx)
            print(f"\033[96m[GeminiClient]\033[0m Loaded {self.total_keys} API key(s). Active Key #{self.current_key_idx} ({masked})")
            logger.info(f"Initialized GeminiFastClient with {self.total_keys} keys.")
            self._init_client()
        else:
            print("\033[91m[GeminiClient]\033[0m WARNING: No Gemini API keys found in settings or environment!")
            logger.warning("No Gemini API keys found.")
            self.client = None

    def _get_masked_key(self, idx: int) -> str:
        if 0 <= idx < len(self.api_keys):
            key = self.api_keys[idx]
            if len(key) > 10:
                return f"{key[:6]}...{key[-4:]}"
            return "******"
        return "N/A"

    def _init_client(self):
        if self.api_keys:
            key = self.api_keys[self.current_key_idx]
            self.client = genai.Client(api_key=key)

    def _get_request_client(self, key_idx: int):
        """Create a client for the current request's event loop and API key."""
        return genai.Client(api_key=self.api_keys[key_idx])

    def _rotate_key(self, failed_key_idx: Optional[int] = None) -> int:
        """Atomically select the key after the key that failed."""
        if self.total_keys > 1:
            with self._rotation_lock:
                prev_idx = (
                    self.current_key_idx
                    if failed_key_idx is None
                    else failed_key_idx
                )
                self.current_key_idx = (prev_idx + 1) % self.total_keys
                next_idx = self.current_key_idx
            masked = self._get_masked_key(self.current_key_idx)
            print(f"\033[93m[GeminiClient]\033[0m Rotated Active Key: Key #{prev_idx} -> Key #{self.current_key_idx} ({masked})")
            logger.warning(f"Rotating Gemini key from #{prev_idx} to #{self.current_key_idx}")
            self._init_client()
            return next_idx
        return 0

    @staticmethod
    def _has_open_object_schema(schema: Type[BaseModel]) -> bool:
        schema_json = schema.model_json_schema()

        def contains_open_object(value: object) -> bool:
            if isinstance(value, dict):
                if value.get("type") == "object" and value.get("additionalProperties") is not False:
                    return True
                return any(contains_open_object(item) for item in value.values())
            if isinstance(value, list):
                return any(contains_open_object(item) for item in value)
            return False

        return contains_open_object(schema_json)

    @staticmethod
    def _build_gemini_response_schema(schema: Type[BaseModel]) -> dict:
        """Build a strict local schema without unsupported Gemini API keywords."""
        schema_json = schema.model_json_schema()

        def remove_unsupported_fields(value: object) -> object:
            if isinstance(value, dict):
                return {
                    key: remove_unsupported_fields(item)
                    for key, item in value.items()
                    if key != "additionalProperties"
                }
            if isinstance(value, list):
                return [remove_unsupported_fields(item) for item in value]
            return value

        return remove_unsupported_fields(schema_json)

    async def execute_structured_query(
        self,
        task_name: str,
        prompt: str,
        system_instruction: str,
        schema: Type[BaseModel],
        use_search_grounding: bool = False,
    ) -> Optional[Any]:
        if not self.client or not self.api_keys:
            print(f"\033[91m[{task_name}]\033[0m Aborted: No valid API key configured.")
            logger.warning(f"[{task_name}] No Gemini API key detected.")
            return None

        if self._has_open_object_schema(schema):
            message = (
                f"[{task_name}] Fatal schema incompatibility: {schema.__name__} "
                "contains an open object. Use typed Pydantic fields and "
                "ConfigDict(extra='forbid')."
            )
            print(f"\033[91m{message}\033[0m")
            logger.critical(message)
            return None

        clean_prompt = (prompt or "").strip()
        if not clean_prompt:
            message = f"[{task_name}] Aborted: Prompt is empty or whitespace."
            print(f"\033[91m{message}\033[0m")
            logger.warning(message)
            return None

        config_kwargs = {
            "system_instruction": system_instruction,
            "temperature": 0.1,
            "max_output_tokens": 2048,
            "response_mime_type": "application/json",
            "response_schema": self._build_gemini_response_schema(schema),
        }
        if use_search_grounding:
            config_kwargs["tools"] = [
                types.Tool(google_search=types.GoogleSearch())
            ]

        config = types.GenerateContentConfig(
            **config_kwargs
        )

        overall_start = time.perf_counter()
        deadline = overall_start + GEMINI_TOTAL_TIMEOUT_SECONDS
        key_attempts = max(1, self.total_keys)
        total_attempts = len(PRIORITY_MODELS) * key_attempts
        attempt_number = 0
        rate_limited_keys = set()

        print(f"\033[94m[{task_name}]\033[0m Execution started across pool ({self.total_keys} keys available)")

        for model_name in PRIORITY_MODELS:
            for _ in range(key_attempts):
                elapsed = time.perf_counter() - overall_start
                remaining_budget = deadline - time.perf_counter()
                if remaining_budget <= 0:
                    logger.warning(
                        f"[{task_name}] Total Gemini retry budget exhausted after "
                        f"{elapsed:.2f}s."
                    )
                    break

                attempt_number += 1
                with self._rotation_lock:
                    active_idx = self.current_key_idx
                active_masked = self._get_masked_key(active_idx)
                print(
                    f"\033[94m[{task_name}]\033[0m [Attempt {attempt_number}/{total_attempts}] "
                    f"Model {model_name} | Key #{active_idx} ({active_masked})"
                )
                model_start = time.perf_counter()
                logger.info(
                    f"[{task_name}] Gemini request started | model={model_name} | key={active_idx}"
                )
                print(
                    f"[{task_name}] Gemini request started | model={model_name} | key={active_idx}"
                )
                try:
                    request_client = self._get_request_client(active_idx)
                    response = await asyncio.wait_for(
                        request_client.aio.models.generate_content(
                            model=model_name,
                            contents=clean_prompt,
                            config=config
                        ),
                        timeout=min(
                            GEMINI_REQUEST_TIMEOUT_SECONDS,
                            remaining_budget
                        )
                    )
                    model_elapsed = time.perf_counter() - model_start
                    total_elapsed = time.perf_counter() - overall_start
                    logger.info(
                        f"[{task_name}] Gemini response received | model={model_name} | "
                        f"response_time={model_elapsed:.3f}s | total_time={total_elapsed:.3f}s"
                    )
                    print(
                        f"[{task_name}] Gemini response received | model={model_name} | "
                        f"response_time={model_elapsed:.3f}s | total_time={total_elapsed:.3f}s"
                    )

                    if response and response.text:
                        print(
                            f"\033[92m[{task_name}]\033[0m SUCCESS via {model_name} on Key #{active_idx} | "
                            f"Model Time: {model_elapsed:.2f}s | Total Time: {total_elapsed:.2f}s"
                        )
                        logger.info(
                            f"[{task_name}] Finished via {model_name} (Key #{active_idx}) in {model_elapsed:.2f}s (Total: {total_elapsed:.2f}s)"
                        )

                        clean_text = response.text.strip()
                        if clean_text.startswith("```json"):
                            clean_text = clean_text[7:]
                        if clean_text.startswith("```"):
                            clean_text = clean_text[3:]
                        if clean_text.endswith("```"):
                            clean_text = clean_text[:-3]

                        return schema.model_validate_json(clean_text.strip())

                    self._rotate_key(active_idx)

                except asyncio.TimeoutError:
                    model_elapsed = time.perf_counter() - model_start
                    total_so_far = time.perf_counter() - overall_start
                    logger.warning(
                        f"[{task_name}] Gemini request timed out | model={model_name} | "
                        f"timeout={GEMINI_REQUEST_TIMEOUT_SECONDS}s | "
                        f"response_time={model_elapsed:.3f}s"
                    )
                    if time.perf_counter() >= deadline:
                        return None
                    self._rotate_key(active_idx)
                    continue

                except APIError as api_err:
                    model_elapsed = time.perf_counter() - model_start
                    total_so_far = time.perf_counter() - overall_start
                    error_code = getattr(api_err, "code", None)
                    error_message = getattr(api_err, "message", str(api_err))
                    logger.warning(
                        f"[{task_name}] Gemini request failed | model={model_name} | "
                        f"response_time={model_elapsed:.3f}s | error_code={error_code} | "
                        f"message={error_message}"
                    )
                    print(
                        f"\033[93m[{task_name}]\033[0m {model_name} APIError {error_code} on Key #{active_idx} "
                        f"(Call Time: {model_elapsed:.2f}s, Running Total: {total_so_far:.2f}s)"
                    )
                    if error_code == 400 or str(error_code) == "400":
                        logger.critical(
                            f"[{task_name}] Fatal 400 Bad Request: Check schema definition "
                            f"({schema.__name__}) and prompt content. Details: {error_message}"
                        )
                        return None
                    if error_code == 404 or str(error_code) == "404":
                        logger.warning(
                            f"[{task_name}] Model {model_name} is unavailable for "
                            f"Key #{active_idx}; skipping remaining keys for this model."
                        )
                        break
                    if error_code in (429, 403) or str(error_code) in {"429", "403"}:
                        quota_exhausted = (
                            error_code == 429
                            and any(
                                marker in str(error_message).lower()
                                for marker in (
                                    "quota",
                                    "rate limit",
                                    "rate-limit",
                                    "resource exhausted",
                                )
                            )
                        )
                        if task_name == "SchemeDiscovery" and quota_exhausted:
                            message = (
                                "[SchemeDiscovery] Quota exhausted; "
                                "stopping before key rotation."
                            )
                            logger.warning(message)
                            print(f"\033[93m{message}\033[0m")
                            return None
                        if error_code == 429 or str(error_code) == "429":
                            rate_limited_keys.add(active_idx)
                        self._rotate_key(active_idx)
                        if (
                            self.total_keys > 0
                            and len(rate_limited_keys) >= self.total_keys
                        ):
                            message = (
                                f"[{task_name}] All configured Gemini keys are "
                                "rate-limited; stopping retries without fabricating a result."
                            )
                            logger.error(message)
                            print(f"\033[91m{message}\033[0m")
                            return None
                    elif error_code == 503 or str(error_code) == "503":
                        await asyncio.sleep(0.5)
                    continue

                except Exception as e:
                    model_elapsed = time.perf_counter() - model_start
                    total_so_far = time.perf_counter() - overall_start
                    err_msg = str(e)
                    if "additionalProperties" in err_msg:
                        message = (
                            f"[{task_name}] Fatal schema incompatibility: {err_msg}. "
                            f"Ensure all models in {schema.__name__} avoid "
                            "Dict[str, Any] and use extra='forbid'."
                        )
                        print(f"\033[91m{message[:240]}\033[0m")
                        logger.critical(message)
                        return None
                    logger.warning(
                        f"[{task_name}] Gemini request failed | model={model_name} | "
                        f"response_time={model_elapsed:.3f}s | error={err_msg[:100]}"
                    )
                    print(
                        f"[{task_name}] Gemini request failed | model={model_name} | "
                        f"response_time={model_elapsed:.3f}s | error={err_msg[:100]}"
                    )
                    print(
                        f"\033[91m[{task_name}]\033[0m {model_name} Exception on Key #{active_idx}: {err_msg[:100]} "
                        f"(Call Time: {model_elapsed:.2f}s, Running Total: {total_so_far:.2f}s)"
                    )
                    logger.warning(f"[{task_name}] {model_name} unexpected error: {err_msg[:100]}")
                    self._rotate_key(active_idx)
                    continue

            if time.perf_counter() - overall_start >= GEMINI_TOTAL_TIMEOUT_SECONDS:
                break

        total_elapsed = time.perf_counter() - overall_start
        message = (
            f"[{task_name}] No successful Gemini response within the "
            f"{GEMINI_TOTAL_TIMEOUT_SECONDS}s retry budget "
            f"({attempt_number} attempts, {total_elapsed:.2f}s elapsed)."
        )
        logger.error(message)
        return None


gemini_fast_client = GeminiFastClient()