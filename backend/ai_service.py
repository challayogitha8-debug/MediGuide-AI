"""Provider routing, bounded retries, safe general-answer caching, and AI metrics."""

import hashlib
import json
import logging
import math
import os
import re
import threading
import time
import urllib.error
from collections import defaultdict, deque
from concurrent.futures import Future
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any, Callable, Optional, Protocol

from fastapi import HTTPException, status

logger = logging.getLogger("MediGuide.ai")

_GENERAL_QUESTION_PATTERNS = (
    re.compile(r"^(what\s+(is|are|does)\b|define\b|explain\b|difference\s+between\b|how\s+does\b|what\s+foods?\b)", re.I),
    re.compile(r"^(क्या\s+है|किसे\s+कहते\s+हैं|का\s+क्या\s+अर्थ|अंतर\s+क्या\s+है)", re.I),
    re.compile(r"^(ఏమిటి|అంటే\s+ఏమిటి|మధ్య\s+తేడా\s+ఏమిటి)", re.I),
)
_PERSONAL_OR_REPORT_PATTERN = re.compile(
    r"\b(i|i'm|i've|my|me|mine|we|our|symptom|pain|feel|feeling|diagnos|prescrib|dose|"
    r"medicine|medication|report|lab result|my result|blood test|my test|patient|uploaded)\b",
    re.I,
)


@dataclass(frozen=True)
class GeneratedAnswer:
    reply: str
    provider: str
    fallback_used: bool = False
    cached: bool = False


@dataclass(frozen=True)
class ProviderAnswer:
    text: str
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    request_count: int = 1


class ProviderFailure(Exception):
    def __init__(
        self,
        provider: str,
        category: str,
        status_code: Optional[int] = None,
        retry_after: Optional[float] = None,
        request_count: int = 1,
    ):
        super().__init__(f"{provider} {category}")
        self.provider = provider
        self.category = category
        self.status_code = status_code
        self.retry_after = retry_after
        self.request_count = request_count


class ChatProvider(Protocol):
    name: str
    configured: bool

    def generate(self, system_prompt: str, history: list[dict[str, str]], message: str) -> ProviderAnswer:
        ...


class GeminiProvider:
    name = "gemini"

    def __init__(self, client_getter: Callable[[], Any]):
        self._client_getter = client_getter

    @property
    def configured(self) -> bool:
        return bool(self._client_getter())

    def generate(self, system_prompt: str, history: list[dict[str, str]], message: str) -> ProviderAnswer:
        client = self._client_getter()
        if client is None:
            raise ProviderFailure(self.name, "not_configured")

        model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip() or "gemini-3.6-flash"
        turns = history + [{"role": "user", "content": message}]
        content = json.dumps(turns, ensure_ascii=False)
        max_retries = _int_setting("AI_RATE_LIMIT_RETRIES", 2, minimum=0, maximum=3)
        max_inline_wait = _int_setting("AI_MAX_INLINE_RETRY_SECONDS", 8, minimum=0, maximum=30)

        for attempt in range(max_retries + 1):
            try:
                from google.genai import types

                response = client.models.generate_content(
                    model=model,
                    contents=content,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.4,
                    ),
                )
                text = (response.text or "").strip() if response else ""
                if not text:
                    raise ProviderFailure(self.name, "empty_response")
                usage = getattr(response, "usage_metadata", None)
                return ProviderAnswer(
                    text,
                    _read_int(usage, "prompt_token_count"),
                    _read_int(usage, "candidates_token_count"),
                    attempt + 1,
                )
            except ProviderFailure:
                raise
            except Exception as error:
                code = getattr(error, "code", None)
                code = code if isinstance(code, int) else None
                retry_after = provider_retry_delay(error, attempt)
                retry_after = _quota_cooldown(error, retry_after)
                category = _error_category(code, error)
                if (
                    code == 429
                    and attempt < max_retries
                    and retry_after <= max_inline_wait
                    and _has_explicit_retry_hint(error)
                    and not _is_exhausted_quota(error)
                ):
                    logger.info(
                        "Provider retry scheduled (provider=gemini, attempt=%s, wait_seconds=%.2f).",
                        attempt + 1,
                        retry_after,
                    )
                    time.sleep(retry_after)
                    continue
                raise ProviderFailure(self.name, category, code, retry_after, attempt + 1) from error

        raise ProviderFailure(self.name, "rate_limit", 429)


class OpenAIProvider:
    """Uses the official OpenAI SDK for an OpenAI-compatible provider."""

    name = "secondary"
    api_key_environment = "OPENAI_API_KEY"
    model_environment = "OPENAI_MODEL"
    timeout_environment = "OPENAI_TIMEOUT_SECONDS"
    base_url: Optional[str] = None

    def __init__(self):
        self.api_key = os.getenv(self.api_key_environment, "").strip()
        self.model = os.getenv(self.model_environment, "").strip()
        self.timeout = _int_setting(self.timeout_environment, 30, minimum=1, maximum=120)
        self._client: Any = None

    @property
    def configured(self) -> bool:
        return bool(self.api_key and self.model)

    def generate(self, system_prompt: str, history: list[dict[str, str]], message: str) -> ProviderAnswer:
        if not self.configured:
            raise ProviderFailure(self.name, "not_configured")

        if self._client is None:
            try:
                from openai import OpenAI

                client_options: dict[str, Any] = {
                    "api_key": self.api_key,
                    "timeout": self.timeout,
                    "max_retries": 0,
                }
                if self.base_url:
                    client_options["base_url"] = self.base_url
                self._client = OpenAI(**client_options)
            except ImportError as error:
                raise ProviderFailure(self.name, "unavailable") from error
            except Exception as error:
                code = getattr(error, "status_code", None)
                code = code if isinstance(code, int) else None
                raise ProviderFailure(
                    self.name,
                    _error_category(code, error),
                    code,
                ) from error

        request_messages = [{"role": "system", "content": system_prompt}]
        request_messages.extend(history)
        request_messages.append({"role": "user", "content": message})
        max_retries = _int_setting("AI_RATE_LIMIT_RETRIES", 2, minimum=0, maximum=3)
        max_inline_wait = _int_setting("AI_MAX_INLINE_RETRY_SECONDS", 8, minimum=0, maximum=30)
        for attempt in range(max_retries + 1):
            try:
                response = self._client.chat.completions.create(
                    model=self.model,
                    messages=request_messages,
                    temperature=0.4,
                    timeout=self.timeout,
                )
                choices = getattr(response, "choices", None) or []
                message_response = getattr(choices[0], "message", None) if choices else None
                text = getattr(message_response, "content", None)
                if not isinstance(text, str) or not text.strip():
                    raise ProviderFailure(self.name, "empty_response")
                usage = getattr(response, "usage", None)
                return ProviderAnswer(
                    text.strip(),
                    _read_int(usage, "prompt_tokens"),
                    _read_int(usage, "completion_tokens"),
                    attempt + 1,
                )
            except ProviderFailure:
                raise
            except Exception as error:
                code = getattr(error, "status_code", None)
                code = code if isinstance(code, int) else None
                response = getattr(error, "response", None)
                headers = getattr(response, "headers", None)
                retry_after = provider_retry_delay(error, attempt, headers)
                retry_after = _quota_cooldown(error, retry_after)
                if self.name == "groq":
                    error_type, error_code, error_param = _safe_provider_error_fields(error)
                    logger.warning(
                        "Groq API error details (http_status=%s, error_type=%s, "
                        "error_code=%s, error_param=%s).",
                        code or "unavailable",
                        error_type,
                        error_code,
                        error_param,
                    )
                failure = ProviderFailure(
                    self.name,
                    _error_category(code, error),
                    code,
                    retry_after,
                    attempt + 1,
                )
                if (
                    code == 429
                    and attempt < max_retries
                    and retry_after <= max_inline_wait
                    and _has_explicit_retry_hint(error, headers)
                    and not _is_exhausted_quota(error)
                ):
                    time.sleep(retry_after)
                    continue
                raise failure from error
        raise ProviderFailure(self.name, "rate_limit", 429)


class GroqProvider(OpenAIProvider):
    """Uses Groq's OpenAI-compatible chat completions API."""

    name = "groq"
    api_key_environment = "GROQ_API_KEY"
    model_environment = "GROQ_MODEL"
    timeout_environment = "GROQ_TIMEOUT_SECONDS"
    base_url = "https://api.groq.com/openai/v1"


class AIService:
    def __init__(
        self,
        gemini_client_getter: Callable[[], Any],
        secondary_provider: Optional[ChatProvider] = None,
        groq_provider: Optional[ChatProvider] = None,
    ):
        self.primary = GeminiProvider(gemini_client_getter)
        self.secondary = secondary_provider or OpenAIProvider()
        self.groq = groq_provider or GroqProvider()
        self.providers = [self.groq, self.primary, self.secondary]
        self._lock = threading.RLock()
        self._cache: dict[str, tuple[float, GeneratedAnswer]] = {}
        self._inflight: dict[str, Future[GeneratedAnswer]] = {}
        self._cooldowns: dict[str, float] = {}
        self._provider_states = {
            provider.name: "unknown"
            for provider in self.providers
        }
        self._switching = 0
        self._last_provider: Optional[str] = None
        self._last_status = "available" if any(
            provider.configured for provider in self.providers
        ) else "unavailable"
        self._request_times: dict[str, deque[float]] = defaultdict(deque)
        self._metrics: dict[str, dict[str, float | int]] = defaultdict(_empty_metrics)

    def generate(
        self,
        message: str,
        language: str,
        history: list[dict[str, str]],
        system_prompt: str,
    ) -> GeneratedAnswer:
        with self._lock:
            self._metrics["service"]["requests"] += 1

        cache_key = self._cache_key(message, language, history)
        if cache_key:
            cached = self._get_cached(cache_key)
            if cached:
                with self._lock:
                    self._metrics["service"]["cache_hits"] += 1
                return GeneratedAnswer(cached.reply, cached.provider, cached.fallback_used, True)

        request_key = _request_key(message, language, history)
        with self._lock:
            existing = self._inflight.get(request_key)
            if existing is None:
                future: Future[GeneratedAnswer] = Future()
                self._inflight[request_key] = future
                owner = True
            else:
                future = existing
                owner = False
                self._metrics["service"]["deduplicated_requests"] += 1
        if not owner:
            return future.result()

        started = time.monotonic()
        try:
            answer = self._generate_from_providers(system_prompt, history, message)
            if cache_key and _int_setting("AI_RESPONSE_CACHE_TTL_SECONDS", 300, minimum=0, maximum=86400) > 0:
                self._put_cached(cache_key, answer)
            future.set_result(answer)
            return answer
        except Exception as error:
            future.set_exception(error)
            raise
        finally:
            elapsed_ms = (time.monotonic() - started) * 1000
            with self._lock:
                self._metrics["service"]["response_time_ms_total"] += elapsed_ms
                self._inflight.pop(request_key, None)

    def _generate_from_providers(
        self,
        system_prompt: str,
        history: list[dict[str, str]],
        message: str,
    ) -> GeneratedAnswer:
        providers = self.providers
        failures: list[ProviderFailure] = []
        for index, provider in enumerate(providers):
            if not provider.configured:
                continue
            with self._lock:
                cooldown_until = self._cooldowns.get(provider.name, 0.0)
                if cooldown_until > time.time():
                    remaining = cooldown_until - time.time()
                    failures.append(ProviderFailure(provider.name, "rate_limit", 429, remaining))
                    logger.warning(
                        "AI provider skipped (provider=%s, category=rate_limit, "
                        "http_status=429, cooldown_seconds=%.0f).",
                        provider.name,
                        remaining,
                    )
                    continue
                self._metrics[provider.name]["requests"] += 1
                if index > 0:
                    self._switching += 1
                    self._last_status = "switching"
                    self._metrics["service"]["provider_switches"] += 1
                    prior_failure = failures[-1] if failures else None
                    logger.info(
                        "AI provider fallback attempted (from=%s, to=%s, reason=%s, http_status=%s).",
                        prior_failure.provider if prior_failure else providers[index - 1].name,
                        provider.name,
                        prior_failure.category if prior_failure else "not_configured",
                        prior_failure.status_code if prior_failure and prior_failure.status_code else "unavailable",
                    )

            started = time.monotonic()
            try:
                result = provider.generate(system_prompt, history, message)
                duration = (time.monotonic() - started) * 1000
                with self._lock:
                    metrics = self._metrics[provider.name]
                    metrics["successes"] += 1
                    metrics["requests"] += max(0, result.request_count - 1)
                    metrics["response_time_ms_total"] += duration
                    self._record_usage(provider.name, metrics, result)
                    self._last_provider = provider.name
                    self._last_status = "available"
                    self._provider_states[provider.name] = "connected"
                logger.info(
                    "AI provider response (provider=%s, outcome=succeeded, fallback=%s, response_time_ms=%.0f).",
                    provider.name,
                    index > 0,
                    duration,
                )
                return GeneratedAnswer(result.text, provider.name, index > 0)
            except ProviderFailure as failure:
                duration = (time.monotonic() - started) * 1000
                failures.append(failure)
                with self._lock:
                    metrics = self._metrics[provider.name]
                    metrics["failures"] += 1
                    metrics["requests"] += max(0, failure.request_count - 1)
                    metrics["response_time_ms_total"] += duration
                    self._provider_states[provider.name] = failure.category
                    if failure.category == "rate_limit":
                        metrics["rate_limits"] += 1
                        cooldown = failure.retry_after
                        if cooldown is None:
                            cooldown = 2.0
                        self._cooldowns[provider.name] = time.time() + max(1.0, cooldown)
                    elif failure.category in ("authentication", "unavailable", "network", "timeout"):
                        self._cooldowns[provider.name] = time.time() + (
                            300.0 if failure.category == "authentication" else 15.0
                        )
                logger.warning(
                    "AI provider request failed (provider=%s, category=%s, status=%s, response_time_ms=%.0f).",
                    provider.name,
                    failure.category,
                    failure.status_code or "unavailable",
                    duration,
                )
                if index > 0:
                    with self._lock:
                        self._last_status = "unavailable"
                    logger.warning(
                        "AI provider fallback outcome (provider=%s, outcome=failed, "
                        "category=%s, http_status=%s).",
                        provider.name,
                        failure.category,
                        failure.status_code or "unavailable",
                    )
                if failure.category == "not_configured":
                    continue
            finally:
                if index > 0:
                    with self._lock:
                        self._switching = max(0, self._switching - 1)

        with self._lock:
            self._last_status = "unavailable"
        with self._lock:
            self._metrics["service"]["failures"] += 1
        logger.error(
            "All configured AI providers failed (categories=%s).",
            ",".join(f"{failure.provider}:{failure.category}" for failure in failures),
        )
        if failures and all(failure.category == "invalid_request" for failure in failures):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="AI providers could not process that question. Please rephrase it and try again.",
            )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI services are temporarily unavailable. Please try again later.",
        )

    def allow_request(self, identities: list[str]) -> tuple[bool, int]:
        limit = _int_setting("AI_RATE_LIMIT_REQUESTS_PER_MINUTE", 20, minimum=1, maximum=1000)
        now = time.time()
        retry_after = 0
        with self._lock:
            for identity in set(identities):
                requests = self._request_times[identity]
                while requests and requests[0] <= now - 60:
                    requests.popleft()
                if len(requests) >= limit:
                    retry_after = max(retry_after, math.ceil(60 - (now - requests[0])))
            if retry_after:
                self._metrics["service"]["rate_limited_requests"] += 1
                return False, retry_after
            for identity in set(identities):
                self._request_times[identity].append(now)
        return True, 0

    def status_snapshot(self) -> dict[str, Any]:
        now = time.time()
        configured_by_provider = {
            provider.name: provider.configured
            for provider in self.providers
        }
        with self._lock:
            active = [
                provider.name
                for provider in self.providers
                if configured_by_provider[provider.name]
                and self._cooldowns.get(provider.name, 0.0) <= now
            ]
            status_value = (
                "switching"
                if self._switching
                else (
                    "available"
                    if active and self._last_status != "unavailable"
                    else "unavailable"
                )
            )
            return {
                "status": status_value,
                "primary_configured": configured_by_provider.get("groq", False),
                "groq_configured": configured_by_provider.get("groq", False),
                "gemini_configured": configured_by_provider.get("gemini", False),
                "secondary_configured": configured_by_provider.get("secondary", False),
                "active_provider": self._last_provider if status_value == "available" else None,
                "providers": {
                    provider.name: {
                        "configured": configured_by_provider[provider.name],
                        "status": (
                            self._provider_states.get(provider.name, "unknown")
                            if configured_by_provider[provider.name]
                            else "not_configured"
                        ),
                        "cooldown_seconds": max(
                            0,
                            math.ceil(self._cooldowns.get(provider.name, 0.0) - now),
                        ),
                    }
                    for provider in self.providers
                },
            }

    def update_provider_health(
        self,
        provider: str,
        provider_status: str,
        retry_after: Optional[float] = None,
    ) -> None:
        with self._lock:
            if provider_status == "connected":
                self._cooldowns.pop(provider, None)
                self._provider_states[provider] = "connected"
            elif provider_status == "rate_limited":
                self._cooldowns[provider] = time.time() + max(60.0, retry_after or 0.0)
                self._provider_states[provider] = "rate_limit"
            elif provider_status in ("invalid_key", "permission_denied"):
                self._cooldowns[provider] = time.time() + 300.0
                self._provider_states[provider] = "authentication"
            elif provider_status in ("timeout", "unavailable", "error"):
                self._cooldowns[provider] = time.time() + 15.0
                self._provider_states[provider] = provider_status

    def provider_cooldown_remaining(self, provider: str) -> float:
        with self._lock:
            return max(0.0, self._cooldowns.get(provider, 0.0) - time.time())

    def provider_health(self, provider: str) -> tuple[str, float]:
        with self._lock:
            return (
                self._provider_states.get(provider, "unknown"),
                max(0.0, self._cooldowns.get(provider, 0.0) - time.time()),
            )

    def metrics_snapshot(self) -> dict[str, Any]:
        with self._lock:
            provider_names = [provider.name for provider in self.providers]
            for name in ("service", *provider_names):
                self._metrics[name]
            result = {
                name: dict(values)
                for name, values in self._metrics.items()
            }
            result["providers_configured"] = {
                provider.name: provider.configured
                for provider in self.providers
            }
            result["pricing_configured"] = {
                provider: (
                    _optional_float_setting(f"{prefix}_INPUT_USD_PER_1M") is not None
                    and _optional_float_setting(f"{prefix}_OUTPUT_USD_PER_1M") is not None
                )
                for provider, prefix in (
                    ("groq", "AI_GROQ"),
                    ("gemini", "AI_GEMINI"),
                    ("secondary", "AI_SECONDARY"),
                )
            }
            result["cooldowns"] = {
                name: max(0, math.ceil(until - time.time()))
                for name, until in self._cooldowns.items()
                if until > time.time()
            }
            return result

    def _record_usage(self, provider: str, metrics: dict[str, float | int], result: ProviderAnswer) -> None:
        if result.input_tokens is None or result.output_tokens is None:
            return
        metrics["input_tokens"] += result.input_tokens
        metrics["output_tokens"] += result.output_tokens
        prefix = {
            "groq": "AI_GROQ",
            "gemini": "AI_GEMINI",
            "secondary": "AI_SECONDARY",
        }.get(provider)
        if prefix is None:
            return
        input_rate = _optional_float_setting(f"{prefix}_INPUT_USD_PER_1M")
        output_rate = _optional_float_setting(f"{prefix}_OUTPUT_USD_PER_1M")
        if input_rate is not None and output_rate is not None:
            metrics["estimated_cost_usd"] += (
                result.input_tokens * input_rate + result.output_tokens * output_rate
            ) / 1_000_000

    def _cache_key(self, message: str, language: str, history: list[dict[str, str]]) -> Optional[str]:
        ttl = _int_setting("AI_RESPONSE_CACHE_TTL_SECONDS", 300, minimum=0, maximum=86400)
        if ttl <= 0 or history or not _is_general_question(message):
            return None
        normalized = " ".join(message.casefold().split())
        context = json.dumps(history, ensure_ascii=False, sort_keys=True)
        return hashlib.sha256(f"{language}\0{normalized}\0{context}".encode("utf-8")).hexdigest()

    def _get_cached(self, key: str) -> Optional[GeneratedAnswer]:
        now = time.time()
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                return None
            if entry[0] <= now:
                self._cache.pop(key, None)
                return None
            return entry[1]

    def _put_cached(self, key: str, answer: GeneratedAnswer) -> None:
        ttl = _int_setting("AI_RESPONSE_CACHE_TTL_SECONDS", 300, minimum=0, maximum=86400)
        if ttl <= 0:
            return
        with self._lock:
            if len(self._cache) >= 256:
                oldest = min(self._cache, key=lambda cache_key: self._cache[cache_key][0])
                self._cache.pop(oldest, None)
            self._cache[key] = (time.time() + ttl, answer)


def build_medical_system_prompt(language: str) -> str:
    language_instruction = {
        "te": "Respond in Telugu (తెలుగు script).",
        "hi": "Respond in Hindi (हिन्दी Devanagari script).",
    }.get(language, "Respond in clear, simple English.")
    return (
        "You are MediGuide AI, a responsible healthcare education assistant. "
        "Answer the user's actual question directly, using recent conversation for context. "
        "Explain uncertainty and general next steps. Never give a definitive diagnosis, prescribe "
        "medicines or dosages, recommend stopping prescribed medicines, or invent medical facts or lab results. "
        "Identify emergency warning signs and advise urgent medical care when appropriate. "
        "This is educational information, not a substitute for a qualified clinician. "
        f"{language_instruction}"
    )


def _is_general_question(message: str) -> bool:
    question = " ".join(message.split())
    if not question or len(question) > 180 or _PERSONAL_OR_REPORT_PATTERN.search(question):
        return False
    return any(pattern.search(question) for pattern in _GENERAL_QUESTION_PATTERNS)


def _request_key(message: str, language: str, history: list[dict[str, str]]) -> str:
    payload = json.dumps([language, history, message], ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def provider_retry_delay(
    error: Any,
    attempt: int,
    headers: Any = None,
) -> float:
    details = getattr(error, "details", None)
    if isinstance(error, dict):
        details = error
    retry_delay: Optional[float] = None
    pending = [details]
    while pending:
        value = pending.pop()
        if isinstance(value, dict):
            for key, nested in value.items():
                if key.lower() in ("retrydelay", "retry_delay"):
                    retry_delay = _duration_seconds(nested)
                    if retry_delay is not None:
                        break
                if isinstance(nested, (dict, list)):
                    pending.append(nested)
            if retry_delay is not None:
                break
        elif isinstance(value, list):
            pending.extend(value)

    response = getattr(error, "response", None)
    response_headers = headers or getattr(response, "headers", None)
    retry_after = response_headers.get("Retry-After") if response_headers is not None else None
    if retry_after is not None:
        parsed = _retry_after_seconds(retry_after)
        if parsed is not None:
            retry_delay = parsed
    return max(0, retry_delay) if retry_delay is not None else float(2 ** attempt)


def _has_explicit_retry_hint(error: Any, headers: Any = None) -> bool:
    response = getattr(error, "response", None)
    response_headers = headers or getattr(response, "headers", None)
    if response_headers is not None and (
        response_headers.get("Retry-After") is not None
        or response_headers.get("retry-after-ms") is not None
    ):
        return True

    pending = [getattr(error, "details", None)]
    while pending:
        value = pending.pop()
        if isinstance(value, dict):
            for key, nested in value.items():
                if key.lower() in ("retrydelay", "retry_delay"):
                    return _duration_seconds(nested) is not None
                if isinstance(nested, (dict, list)):
                    pending.append(nested)
        elif isinstance(value, list):
            pending.extend(value)
    return False


def _is_exhausted_quota(error: Any) -> bool:
    quota_markers = (
        "insufficient_quota",
        "quota_exceeded",
        "daily_limit_exceeded",
        "quota exhausted",
        "quota exceeded",
        "exceeded your current quota",
    )
    pending = [
        getattr(error, "code", None),
        getattr(error, "details", None),
        getattr(error, "body", None),
    ]
    while pending:
        value = pending.pop()
        if isinstance(value, str):
            if any(marker in value.lower() for marker in quota_markers):
                return True
        elif isinstance(value, dict):
            pending.extend(value.values())
        elif isinstance(value, list):
            pending.extend(value)
    return False


def _quota_cooldown(error: Any, retry_after: float) -> float:
    if not _is_exhausted_quota(error):
        return retry_after
    configured_cooldown = _int_setting(
        "AI_QUOTA_COOLDOWN_SECONDS",
        300,
        minimum=30,
        maximum=86400,
    )
    return max(retry_after, float(configured_cooldown))


def _duration_seconds(value: Any) -> Optional[float]:
    try:
        if isinstance(value, dict):
            value = float(value.get("seconds", 0)) + float(value.get("nanos", 0)) / 1_000_000_000
        elif isinstance(value, str) and value.strip().endswith("s"):
            value = float(value.strip()[:-1])
        else:
            value = float(value)
        return value if math.isfinite(value) and value >= 0 else None
    except (TypeError, ValueError, OverflowError):
        return None


def _retry_after_seconds(value: Any) -> Optional[float]:
    seconds = _duration_seconds(value)
    if seconds is not None:
        return seconds
    try:
        date = parsedate_to_datetime(str(value))
        if date.tzinfo is None:
            date = date.replace(tzinfo=timezone.utc)
        return max(0.0, (date - datetime.now(timezone.utc)).total_seconds())
    except (TypeError, ValueError, OverflowError, IndexError):
        return None


def _error_category(code: Optional[int], error: Exception) -> str:
    if code == 429:
        return "rate_limit"
    if code in (401, 403):
        return "authentication"
    if code in (400, 404):
        return "invalid_request"
    if code in (500, 502, 503, 504):
        return "unavailable"
    if code in (408,):
        return "timeout"
    if isinstance(error, TimeoutError) or "timeout" in type(error).__name__.lower():
        return "timeout"
    if isinstance(error, (urllib.error.URLError, OSError)):
        return "network"
    return "provider_error"


def _safe_provider_error_fields(error: Exception) -> tuple[str, str, str]:
    body = getattr(error, "body", None)
    if not isinstance(body, dict):
        response = getattr(error, "response", None)
        try:
            body = response.json() if response is not None else None
        except Exception:
            body = None
    details = body.get("error", body) if isinstance(body, dict) else {}
    if not isinstance(details, dict):
        return "unknown", "unknown", "unknown"

    def safe_field(name: str) -> str:
        value = details.get(name)
        if not isinstance(value, (str, int)):
            return "unknown"
        normalized = " ".join(str(value).split())
        return normalized[:100] or "unknown"

    return safe_field("type"), safe_field("code"), safe_field("param")


def _int_setting(name: str, default: int, minimum: int, maximum: int) -> int:
    try:
        return min(maximum, max(minimum, int(os.getenv(name, str(default)))))
    except ValueError:
        return default


def _optional_float_setting(name: str) -> Optional[float]:
    try:
        value = float(os.getenv(name, ""))
        return value if math.isfinite(value) and value >= 0 else None
    except ValueError:
        return None


def _read_int(value: Any, key: str) -> Optional[int]:
    result = getattr(value, key, None)
    return result if isinstance(result, int) else None


def _empty_metrics() -> dict[str, float | int]:
    return {
        "requests": 0,
        "successes": 0,
        "failures": 0,
        "rate_limits": 0,
        "input_tokens": 0,
        "output_tokens": 0,
        "response_time_ms_total": 0.0,
        "estimated_cost_usd": 0.0,
        "cache_hits": 0,
        "deduplicated_requests": 0,
        "provider_switches": 0,
        "rate_limited_requests": 0,
    }
