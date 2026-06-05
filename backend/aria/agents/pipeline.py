"""The ADK multi-agent pipeline: Planner → Reasoner → Executor.

Built only in live mode. This is the Google Cloud Agent Builder / ADK
realization of ARIA's architecture. The Reasoner is equipped with both partner
MCP toolsets so a single Gemini agent can pull from Dynatrace and Arize Phoenix
in the same reasoning loop — the cross-boundary correlation that is ARIA's
core insight.
"""

from __future__ import annotations

from ..config import Settings
from ..prompts import (
    EXECUTOR_INSTRUCTION,
    PLANNER_INSTRUCTION,
    REASONER_INSTRUCTION,
)
from ..tools.mcp_tools import build_all_toolsets


def build_root_agent(settings: Settings):
    """Construct the ARIA root agent as a sequential Planner→Reasoner→Executor.

    Returns an ADK agent ready to be run by a Runner. Raises ImportError if
    google-adk is not installed (callers should guard with settings.is_live).
    """
    from google.adk.agents import LlmAgent, SequentialAgent

    model = settings.aria_model
    partner_tools = build_all_toolsets(settings)

    planner = LlmAgent(
        name="aria_planner",
        model=model,
        instruction=PLANNER_INSTRUCTION,
        description="Breaks an incident goal into an ordered investigation plan.",
        output_key="plan",
    )

    # The Reasoner holds the partner MCP tools — it pulls and correlates.
    reasoner = LlmAgent(
        name="aria_reasoner",
        model=model,
        instruction=REASONER_INSTRUCTION,
        description=(
            "Pulls Dynatrace + Arize Phoenix context and correlates signals "
            "across the infra/model boundary to find root cause."
        ),
        tools=partner_tools,
        output_key="diagnosis",
    )

    executor = LlmAgent(
        name="aria_executor",
        model=model,
        instruction=EXECUTOR_INSTRUCTION,
        description="Classifies and executes remediation under human oversight.",
        tools=partner_tools,
        output_key="remediation",
    )

    return SequentialAgent(
        name="aria_root",
        description=(
            "ARIA — autonomous reasoning & incident agent spanning infra "
            "(Dynatrace) and model (Arize Phoenix) observability."
        ),
        sub_agents=[planner, reasoner, executor],
    )
