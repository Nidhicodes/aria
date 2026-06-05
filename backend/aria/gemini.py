"""Thin Gemini client used by the reasoning engine.

Uses the google-genai SDK when available + credentialed. Provides a single
``generate_json`` and ``generate_text`` surface so the engine doesn't care
whether it's talking to Gemini 3 via the Gemini API or Vertex AI.

If the SDK isn't installed or there's no key, callers fall back to scripted
reasoning so the demo always runs.
"""

from __future__ import annotations

import json
import re
from typing import Any

from .config import Settings


class GeminiUnavailable(RuntimeError):
    """Raised when Gemini cannot be reached; callers should use fallback."""


class GeminiClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client = None

    def _ensure(self):
        if self._client is not None:
            return self._client
        if not self.settings.has_gemini:
            raise GeminiUnavailable("no Gemini credentials configured")
        try:
            from google import genai
        except ImportError as exc:  # pragma: no cover - import guard
            raise GeminiUnavailable("google-genai not installed") from exc

        if self.settings.google_genai_use_vertexai:
            self._client = genai.Client(
                vertexai=True,
                project=self.settings.google_cloud_project,
                location=self.settings.google_cloud_location,
            )
        else:
            self._client = genai.Client(api_key=self.settings.google_api_key)
        return self._client

    @property
    def available(self) -> bool:
        return self.settings.has_gemini

    async def generate_text(self, instruction: str, prompt: str) -> str:
        client = self._ensure()
        from google.genai import types

        resp = await client.aio.models.generate_content(
            model=self.settings.aria_model,
            contents=prompt,
            config=types.GenerateContentConfig(system_instruction=instruction),
        )
        return (resp.text or "").strip()

    async def generate_json(self, instruction: str, prompt: str) -> dict[str, Any]:
        text = await self.generate_text(instruction, prompt)
        return _extract_json(text)

    def extract_json(self, text: str) -> dict[str, Any]:
        """Public helper to parse a model response into JSON (raises on failure)."""
        return _extract_json(text)


def _extract_json(text: str) -> dict[str, Any]:
    """Best-effort JSON extraction from a model response."""
    text = text.strip()
    # Strip markdown fences if present.
    fence = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if fence:
        text = fence.group(1)
    # Find the first balanced-looking object.
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]
    return json.loads(text)
