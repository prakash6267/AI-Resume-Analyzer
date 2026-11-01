import json
import time
import logging
import httpx
from typing import Type, TypeVar, Optional, List, Dict, Any
from fastapi import HTTPException
from pydantic import BaseModel, ValidationError

from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.config import settings

logger = logging.getLogger("resumeai.llm_orchestrator")

T = TypeVar("T", bound=BaseModel)

CURATED_GEMINI_MODELS: List[str] = [
    "gemini-3-flash-preview",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
]

class KeyState:
    def __init__(self, key: str, index: int):
        self.key = key
        self.index = index
        self.failed_count = 0
        self.cooldown_until = 0.0
        self.last_used = 0.0

    @property
    def is_available(self) -> bool:
        return time.time() >= self.cooldown_until

    def mark_success(self):
        self.failed_count = 0
        self.last_used = time.time()

    def mark_rate_limited(self, cooldown_seconds: float = 60.0):
        self.failed_count += 1
        self.cooldown_until = time.time() + cooldown_seconds
        logger.warning(f"[GEMINI KEY ROTATION] Key #{self.index + 1} ({self.key[:6]}...) rate-limited/exhausted. Cooling down for {cooldown_seconds}s.")

    def mark_failed(self, cooldown_seconds: float = 120.0):
        self.failed_count += 1
        self.cooldown_until = time.time() + cooldown_seconds
        logger.error(f"[GEMINI KEY ROTATION] Key #{self.index + 1} ({self.key[:6]}...) failed auth/permission. Cooling down for {cooldown_seconds}s.")

class LLMOrchestrator:
    def __init__(self):
        self._key_states: List[KeyState] = []
        self._current_key_idx: int = 0
        self._active_provider: str = settings.DEFAULT_AI_PROVIDER
        self._ollama_available: bool = False
        self._cached_gemini_models: List[str] = []
        self._cached_ollama_models: List[str] = []
        self._refresh_keys()

    def _refresh_keys(self):
        keys = settings.get_gemini_keys_list()
        self._key_states = [KeyState(k, i) for i, k in enumerate(keys)]
        logger.info(f"Initialized LLM Orchestrator with {len(self._key_states)} Gemini API Key(s).")

    def get_active_gemini_key_state(self) -> Optional[KeyState]:
        if not self._key_states:
            self._refresh_keys()
        if not self._key_states:
            return None

        # Try to find next available key
        total = len(self._key_states)
        for i in range(total):
            idx = (self._current_key_idx + i) % total
            if self._key_states[idx].is_available:
                self._current_key_idx = idx
                return self._key_states[idx]

        # If all keys are in cooldown, pick the one that expires earliest
        earliest_key = min(self._key_states, key=lambda k: k.cooldown_until)
        return earliest_key

    def rotate_to_next_key(self):
        if self._key_states:
            self._current_key_idx = (self._current_key_idx + 1) % len(self._key_states)
            logger.info(f"Rotated to Gemini Key #{self._current_key_idx + 1}")

    def check_ollama_health(self) -> bool:
        """Check if local Ollama server is running and reachable."""
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    self._cached_ollama_models = models
                    self._ollama_available = True
                    return True
        except Exception as e:
            logger.debug(f"Ollama health check: not reachable ({e})")
        self._ollama_available = False
        return False

    def get_status(self) -> Dict[str, Any]:
        """Returns comprehensive engine & provider status for admin dashboard."""
        ollama_ok = self.check_ollama_health()
        keys_summary = [
            {
                "index": ks.index + 1,
                "preview": f"{ks.key[:4]}...{ks.key[-4:]}" if len(ks.key) > 8 else "***",
                "is_available": ks.is_available,
                "failed_count": ks.failed_count,
                "in_cooldown": not ks.is_available
            }
            for ks in self._key_states
        ]

        return {
            "active_provider": self._active_provider,
            "gemini": {
                "total_keys": len(self._key_states),
                "active_key_index": (self._current_key_idx + 1) if self._key_states else 0,
                "model": settings.GEMINI_MODEL,
                "keys": keys_summary,
                "ready": any(k.is_available for k in self._key_states) if self._key_states else False
            },
            "ollama": {
                "available": ollama_ok,
                "base_url": settings.OLLAMA_BASE_URL,
                "model": settings.OLLAMA_MODEL,
                "installed_models": self._cached_ollama_models
            },
            "openai_fallback": bool(settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip()),
            "groq_fallback": bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip())
        }

    def set_active_provider(self, provider: str):
        if provider in ["gemini", "ollama", "openai", "groq"]:
            self._active_provider = provider
            logger.info(f"Switched active AI provider to: {provider}")

    # ==========================================
    # 1. Primary Structured Inference Caller
    # ==========================================
    def call_structured(
        self,
        prompt: str,
        schema: Type[T],
        temperature: float = 0.3,
        file_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
        retry_count: int = 1
    ) -> T:
        """
        Orchestrates inference across:
        1. Configured active provider
        2. Multi-key Gemini rotation
        3. Local Ollama model
        4. Optional OpenAI/Groq fallback
        """
        providers_to_try = [self._active_provider]
        if "gemini" not in providers_to_try:
            providers_to_try.append("gemini")
        if "ollama" not in providers_to_try:
            providers_to_try.append("ollama")
        if settings.GROQ_API_KEY and "groq" not in providers_to_try:
            providers_to_try.append("groq")
        if settings.OPENAI_API_KEY and "openai" not in providers_to_try:
            providers_to_try.append("openai")

        last_error = ""

        for provider in providers_to_try:
            try:
                if provider == "gemini":
                    result = self._call_gemini_multikey(
                        prompt=prompt,
                        schema=schema,
                        temperature=temperature,
                        file_bytes=file_bytes,
                        mime_type=mime_type,
                        retry_count=retry_count
                    )
                    if result:
                        return result

                elif provider == "ollama":
                    if self.check_ollama_health():
                        logger.info(f"[OLLAMA] Executing structured inference with local model '{settings.OLLAMA_MODEL}'")
                        result = self._call_ollama(
                            prompt=prompt,
                            schema=schema,
                            temperature=temperature
                        )
                        if result:
                            return result

                elif provider == "groq" and settings.GROQ_API_KEY:
                    logger.info("[GROQ] Executing structured inference via Groq Cloud fallback")
                    result = self._call_openai_compatible(
                        base_url="https://api.groq.com/openai/v1",
                        api_key=settings.GROQ_API_KEY,
                        model=settings.GROQ_MODEL,
                        prompt=prompt,
                        schema=schema,
                        temperature=temperature
                    )
                    if result:
                        return result

                elif provider == "openai" and settings.OPENAI_API_KEY:
                    logger.info("[OPENAI] Executing structured inference via OpenAI fallback")
                    result = self._call_openai_compatible(
                        base_url="https://api.openai.com/v1",
                        api_key=settings.OPENAI_API_KEY,
                        model=settings.OPENAI_MODEL,
                        prompt=prompt,
                        schema=schema,
                        temperature=temperature
                    )
                    if result:
                        return result

            except Exception as e:
                logger.warning(f"Provider '{provider}' failed ({e}). Proceeding to next provider in fallback pipeline...")
                last_error = str(e)

        logger.error(f"[ALL LLM PROVIDERS EXHAUSTED] Last error: {last_error}")
        raise HTTPException(
            status_code=503,
            detail="The AI service is temporarily busy. Multi-account key rotation and local fallback attempted."
        )

    # ==========================================
    # 2. Gemini Multi-Key & Multi-Account Handler
    # ==========================================
    def _call_gemini_multikey(
        self,
        prompt: str,
        schema: Type[T],
        temperature: float,
        file_bytes: Optional[bytes],
        mime_type: Optional[str],
        retry_count: int
    ) -> Optional[T]:
        if not self._key_states:
            self._refresh_keys()
        if not self._key_states:
            logger.warning("No Gemini API keys configured.")
            return None

        keys_tried = 0
        total_keys = len(self._key_states)

        while keys_tried < total_keys:
            key_state = self.get_active_gemini_key_state()
            if not key_state:
                break

            client = genai.Client(api_key=key_state.key.strip())
            models_to_try = [settings.GEMINI_MODEL] + [m for m in CURATED_GEMINI_MODELS if m != settings.GEMINI_MODEL]

            base_contents = []
            if file_bytes and mime_type:
                base_contents.append(types.Part.from_bytes(data=file_bytes, mime_type=mime_type))
            base_contents.append(prompt)

            for model_name in models_to_try:
                contents = list(base_contents)
                for attempt in range(retry_count + 1):
                    try:
                        logger.info(
                            f"[GEMINI] Key #{key_state.index + 1} -> Model '{model_name}' (attempt {attempt + 1})"
                        )
                        response = client.models.generate_content(
                            model=model_name,
                            contents=contents,
                            config=types.GenerateContentConfig(
                                response_mime_type="application/json",
                                response_schema=schema,
                                temperature=temperature,
                            )
                        )

                        raw_text = response.text
                        if not raw_text:
                            raise ValueError("Received empty response from Gemini API")

                        parsed = schema.model_validate_json(raw_text)
                        key_state.mark_success()
                        return parsed

                    except ValidationError as ve:
                        logger.warning(f"[GEMINI SCHEMA WARNING] on {model_name}: {ve}")
                        if attempt < retry_count:
                            contents.append(f"Fix JSON schema error: {ve}. Return exact JSON.")
                            continue
                        break

                    except APIError as ae:
                        code = getattr(ae, "code", 500)
                        msg = ae.message if hasattr(ae, "message") else str(ae)
                        logger.warning(f"[GEMINI API ERROR] Code {code} on key #{key_state.index + 1}: {msg}")

                        if code == 429 or "quota" in msg.lower() or "rate" in msg.lower():
                            key_state.mark_rate_limited(cooldown_seconds=60.0)
                            break
                        elif code == 503 or "high demand" in msg.lower():
                            key_state.mark_rate_limited(cooldown_seconds=15.0)
                            break
                        elif code in (400, 403):
                            key_state.mark_failed(cooldown_seconds=300.0)
                            break
                        elif code in (404, 500, 502, 504):
                            break

                    except Exception as e:
                        logger.warning(f"[GEMINI ERROR] on key #{key_state.index + 1}: {e}")
                        break

            # Rotate to next key if this key didn't succeed with any model
            self.rotate_to_next_key()
            keys_tried += 1

        return None

    # ==========================================
    # 3. Local Ollama Model Client
    # ==========================================
    def _call_ollama(
        self,
        prompt: str,
        schema: Type[T],
        temperature: float = 0.3
    ) -> Optional[T]:
        system_prompt = (
            "You are an enterprise ATS Resume Intelligence Engine. "
            "You must strictly output VALID JSON adhering strictly to the required schema with zero markdown wrapping."
        )

        schema_json = json.dumps(schema.model_json_schema(), indent=2)
        full_prompt = f"{prompt}\n\nREQUIRED JSON SCHEMA:\n{schema_json}\n\nReturn ONLY raw valid JSON matching this schema:"

        payload = {
            "model": settings.OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": full_prompt}
            ],
            "format": "json",
            "stream": False,
            "options": {
                "temperature": temperature
            }
        }

        try:
            with httpx.Client(timeout=90.0) as client:
                res = client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/chat",
                    json=payload
                )

                if res.status_code == 200:
                    data = res.json()
                    content = data.get("message", {}).get("content", "")
                    if content:
                        parsed = schema.model_validate_json(content)
                        logger.info(f"[OLLAMA SUCCESS] Validated output using local {settings.OLLAMA_MODEL}")
                        return parsed
                else:
                    logger.warning(f"[OLLAMA ERROR] HTTP {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"[OLLAMA INFERENCE FAILED] {e}")

        return None

    # ==========================================
    # 4. OpenAI / Groq Compatible Fallback
    # ==========================================
    def _call_openai_compatible(
        self,
        base_url: str,
        api_key: str,
        model: str,
        prompt: str,
        schema: Type[T],
        temperature: float = 0.3
    ) -> Optional[T]:
        schema_json = json.dumps(schema.model_json_schema(), indent=2)
        system_instruction = (
            "You are a professional ATS resume optimizer. "
            f"You MUST output valid JSON matching this schema:\n{schema_json}"
        )

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": temperature
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        try:
            with httpx.Client(timeout=45.0) as client:
                res = client.post(
                    f"{base_url}/chat/completions",
                    json=payload,
                    headers=headers
                )
                if res.status_code == 200:
                    data = res.json()
                    raw = data["choices"][0]["message"]["content"]
                    return schema.model_validate_json(raw)
                else:
                    logger.warning(f"OpenAI-compatible error {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"OpenAI-compatible inference failed: {e}")

        return None

# Singleton instance
llm_orchestrator = LLMOrchestrator()
# Alias for backward compatibility
gemini_service = llm_orchestrator
