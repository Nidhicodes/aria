"""Tests for ARIA's reasoning engine in demo mode (no external credentials)."""

from __future__ import annotations

import asyncio

import pytest

from aria.config import Settings
from aria.engine import IncidentEngine
from aria.incident import ActionMode, ActionStatus, IncidentPhase
from aria.tools import scenarios


def make_engine() -> IncidentEngine:
    # Force demo mode with no Gemini key → scripted reasoning path.
    # Fast beat + short approval timeout keep the suite snappy.
    return IncidentEngine(
        Settings(aria_mode="demo", google_api_key=""),
        approval_timeout=3.0,
        beat=0.0,
    )


def test_scenarios_registered():
    keys = {s["key"] for s in scenarios.list_scenarios()}
    assert {"memory_hallucination", "cpu_timeout", "deploy_regression"} <= keys


def test_inject_creates_incident_with_signals():
    engine = make_engine()
    incident = engine.inject("memory_hallucination")
    assert incident.phase == IncidentPhase.DETECTED
    assert len(incident.signals) > 0
    # Cross-layer: must contain both sources.
    sources = {s.source.value for s in incident.signals}
    assert sources == {"dynatrace", "arize"}


async def test_full_run_resolves_with_auto_approval():
    engine = make_engine()
    incident = engine.inject("memory_hallucination")

    async def approver():
        # Approve gated actions as they appear.
        for _ in range(60):
            await asyncio.sleep(0.2)
            inc = engine.get(incident.id)
            for a in inc.actions:
                if a.mode == ActionMode.NEEDS_APPROVAL and a.status == ActionStatus.PROPOSED:
                    engine.approve(incident.id, a.id)

    task = asyncio.create_task(approver())
    events = [e async for e in engine.run(incident.id)]
    task.cancel()

    types = [e.type for e in events]
    assert "root_cause" in types
    assert "report" in types
    assert types[-1] == "done"

    inc = engine.get(incident.id)
    assert inc.phase == IncidentPhase.RESOLVED
    # The hero scenario crosses the infra/model boundary.
    assert inc.root_cause.crosses_boundary is True
    assert 0.0 < inc.root_cause.confidence <= 1.0
    assert len(inc.root_cause.causal_chain) >= 2
    # Every action should have reached a terminal state.
    assert all(a.status in {ActionStatus.DONE, ActionStatus.REJECTED}
               for a in inc.actions)
    assert inc.report.startswith("# Incident Report")


async def test_reject_action_is_not_executed():
    engine = make_engine()
    incident = engine.inject("deploy_regression")

    async def rejecter():
        for _ in range(60):
            await asyncio.sleep(0.2)
            inc = engine.get(incident.id)
            for a in inc.actions:
                if a.mode == ActionMode.NEEDS_APPROVAL and a.status == ActionStatus.PROPOSED:
                    engine.reject(incident.id, a.id)

    task = asyncio.create_task(rejecter())
    _ = [e async for e in engine.run(incident.id)]
    task.cancel()

    inc = engine.get(incident.id)
    rejected = [a for a in inc.actions if a.status == ActionStatus.REJECTED]
    assert len(rejected) >= 1
    assert all("reject" in a.result.lower() for a in rejected)


def test_baseline_signals_are_calm():
    engine = make_engine()
    sigs = engine.baseline_signals("memory_hallucination")
    assert len(sigs) > 0
    assert all(s.severity.value in {"ok", "info"} for s in sigs)
