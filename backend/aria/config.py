"""Runtime configuration for ARIA.

Loads from environment / .env. Designed so the project runs out-of-the-box in
``demo`` mode with zero credentials, and upgrades to ``live`` mode (real
Dynatrace + Arize Phoenix MCP servers, real Gemini) when secrets are present.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env locations relative to this file so it works no matter where the
# server is launched from. Precedence: aria/backend/.env first, then aria/.env.
_BACKEND_DIR = Path(__file__).resolve().parent.parent  # …/aria/backend
_ARIA_DIR = _BACKEND_DIR.parent                          # …/aria
_ENV_FILES = (
    str(_ARIA_DIR / ".env"),
    str(_BACKEND_DIR / ".env"),
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ── Mode ────────────────────────────────────────────────────────────
    aria_mode: Literal["demo", "live"] = "demo"

    # ── Gemini brain ────────────────────────────────────────────────────
    google_api_key: str = ""
    aria_model: str = "gemini-3-pro-preview"
    google_genai_use_vertexai: bool = False
    google_cloud_project: str = ""
    google_cloud_location: str = "global"

    # ── Arize Phoenix MCP ───────────────────────────────────────────────
    phoenix_host: str = "https://app.phoenix.arize.com"
    phoenix_api_key: str = ""
    phoenix_project: str = "default"

    # ── Dynatrace MCP ───────────────────────────────────────────────────
    dt_environment: str = ""
    dt_platform_token: str = ""
    slack_connection_id: str = ""

    # ── Server ──────────────────────────────────────────────────────────
    aria_host: str = "0.0.0.0"
    aria_port: int = 8000
    aria_cors_origins: str = "*"

    # ── Derived helpers ─────────────────────────────────────────────────
    @property
    def cors_origins(self) -> list[str]:
        raw = self.aria_cors_origins.strip()
        if raw == "*":
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]

    @property
    def has_gemini(self) -> bool:
        """True when we can actually call Gemini (API key or Vertex project)."""
        return bool(self.google_api_key) or (
            self.google_genai_use_vertexai and bool(self.google_cloud_project)
        )

    @property
    def has_dynatrace(self) -> bool:
        return bool(self.dt_environment)

    @property
    def has_phoenix(self) -> bool:
        return bool(self.phoenix_api_key)

    @property
    def is_live(self) -> bool:
        return self.aria_mode == "live"

    def reasoning_backend(self) -> str:
        """Human-readable description of what's actually driving reasoning."""
        if self.has_gemini:
            return f"gemini:{self.aria_model}"
        return "scripted-fallback"


@lru_cache
def get_settings() -> Settings:
    return Settings()
