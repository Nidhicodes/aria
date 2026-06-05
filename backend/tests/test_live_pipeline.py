"""Live-mode construction tests.

These verify the ADK multi-agent pipeline and MCP toolsets assemble correctly.
They are skipped automatically when google-adk / mcp aren't installed (e.g. a
demo-only environment), so the core suite always runs.
"""

from __future__ import annotations

import pytest

from aria.config import Settings

adk = pytest.importorskip("google.adk", reason="google-adk not installed")


def _live_settings() -> Settings:
    return Settings(
        aria_mode="live",
        google_api_key="test-construction-key",
        dt_environment="https://abc12345.apps.dynatrace.com",
        dt_platform_token="dt0s16.FAKE",
        phoenix_host="https://app.phoenix.arize.com",
        phoenix_api_key="phx-fake",
    )


def test_partner_toolsets_build():
    from aria.tools.mcp_tools import build_all_toolsets

    toolsets = build_all_toolsets(_live_settings())
    # Both partners configured → two MCP toolsets.
    assert len(toolsets) == 2


def test_root_agent_is_planner_reasoner_executor():
    from aria.agents.pipeline import build_root_agent

    agent = build_root_agent(_live_settings())
    names = [a.name for a in agent.sub_agents]
    assert names == ["aria_planner", "aria_reasoner", "aria_executor"]
    # The reasoner must carry both partner MCP toolsets (the correlation engine).
    reasoner = agent.sub_agents[1]
    assert len(reasoner.tools) == 2


def test_only_configured_partners_attach():
    from aria.tools.mcp_tools import build_all_toolsets

    s = _live_settings()
    s.phoenix_api_key = ""  # drop Arize
    toolsets = build_all_toolsets(s)
    assert len(toolsets) == 1
