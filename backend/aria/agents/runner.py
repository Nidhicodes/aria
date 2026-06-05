"""Live-mode ADK runner.

Drives the Planner → Reasoner → Executor pipeline through an ADK Runner, with
the Dynatrace + Arize Phoenix MCP toolsets attached. Returns the agents' final
textual diagnosis, which the engine parses into ARIA's structured result.

This is only used when ``ARIA_MODE=live`` and google-adk is installed. Any
failure here is caught by the engine, which falls back to the direct-Gemini
correlation path so the product never hard-fails.
"""

from __future__ import annotations

import os

from ..config import Settings
from ..prompts import CORRELATION_JSON_REQUEST, SIGNAL_COLLECTION_INSTRUCTION


def _ensure_env(settings: Settings) -> None:
    """Inject Gemini credentials into env vars so ADK's internal Client() picks them up.

    ADK reads GOOGLE_API_KEY / GOOGLE_GENAI_USE_VERTEXAI / GOOGLE_CLOUD_PROJECT
    directly from the environment; our pydantic Settings loaded them from .env but
    ADK doesn't know about that.
    """
    if settings.google_api_key and not os.environ.get("GOOGLE_API_KEY"):
        os.environ["GOOGLE_API_KEY"] = settings.google_api_key
    if settings.google_genai_use_vertexai:
        os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "true")
    if settings.google_cloud_project:
        os.environ.setdefault("GOOGLE_CLOUD_PROJECT", settings.google_cloud_project)
    if settings.google_cloud_location:
        os.environ.setdefault("GOOGLE_CLOUD_LOCATION", settings.google_cloud_location)


async def _run_agent(agent, prompt: str) -> str:
    """Run a single ADK agent to completion and return its final text."""
    from google.adk.runners import InMemoryRunner
    from google.genai import types

    runner = InMemoryRunner(agent=agent, app_name="aria")
    user_id = "aria-ops"
    session = await runner.session_service.create_session(
        app_name="aria", user_id=user_id
    )
    message = types.Content(role="user", parts=[types.Part(text=prompt)])

    final_text = ""
    async for event in runner.run_async(
        user_id=user_id, session_id=session.id, new_message=message
    ):
        if event.content and event.content.parts:
            for part in event.content.parts:
                if getattr(part, "text", None):
                    final_text = part.text
    return final_text


async def collect_live_signals(settings: Settings) -> str:
    """Pull real signals from Dynatrace + Arize via an MCP-equipped agent.

    Returns the agent's JSON text (parsed by the caller). Raises ImportError if
    ADK isn't installed; the engine guards for this.
    """
    _ensure_env(settings)
    from google.adk.agents import LlmAgent

    from ..tools.mcp_tools import build_all_toolsets

    collector = LlmAgent(
        name="aria_collector",
        model=settings.aria_model,
        instruction=SIGNAL_COLLECTION_INSTRUCTION,
        description="Pulls live signals from Dynatrace and Arize Phoenix via MCP.",
        tools=build_all_toolsets(settings),
    )
    return await _run_agent(
        collector,
        "Pull the current cross-layer system state for the last 30 minutes.",
    )


async def run_adk_diagnosis(settings: Settings, signals_block: str) -> str:
    """Run the ADK multi-agent pipeline and return the final response text.

    Raises ImportError if ADK isn't installed; the engine guards for this.
    """
    _ensure_env(settings)
    from .pipeline import build_root_agent

    root_agent = build_root_agent(settings)
    prompt = CORRELATION_JSON_REQUEST.replace("{signals}", signals_block)
    return await _run_agent(root_agent, prompt)
