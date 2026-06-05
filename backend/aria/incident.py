"""Domain models for ARIA: signals, reasoning steps, actions, incidents.

These are the shapes that flow from the observability layer (Dynatrace + Arize
Phoenix), through the reasoning engine, out to the dashboard over SSE.
"""

from __future__ import annotations

import time
import uuid
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


def _now_ms() -> int:
    return int(time.time() * 1000)


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


# ─────────────────────────────────────────────────────────────────────────
# Signals
# ─────────────────────────────────────────────────────────────────────────
class SignalSource(str, Enum):
    DYNATRACE = "dynatrace"
    ARIZE = "arize"


class Severity(str, Enum):
    OK = "ok"
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class Signal(BaseModel):
    """A single observability data point pulled from a partner system."""

    id: str = Field(default_factory=lambda: _id("sig"))
    source: SignalSource
    name: str
    value: float
    unit: str = ""
    severity: Severity = Severity.OK
    # Free-form detail useful for the reasoning prompt and the UI.
    detail: str = ""
    entity: str = ""
    captured_at: int = Field(default_factory=_now_ms)

    def as_prompt_line(self) -> str:
        sev = self.severity.value.upper()
        loc = f" on {self.entity}" if self.entity else ""
        unit = self.unit
        return f"[{self.source.value}] {self.name}{loc}: {self.value}{unit} ({sev}) — {self.detail}"


# ─────────────────────────────────────────────────────────────────────────
# Reasoning chain
# ─────────────────────────────────────────────────────────────────────────
class ReasoningKind(str, Enum):
    PULL = "pull"          # pulling data from a system
    CORRELATE = "correlate"  # connecting signals across systems
    HYPOTHESIS = "hypothesis"
    ROOT_CAUSE = "root_cause"
    PLAN = "plan"
    EXECUTE = "execute"
    REPORT = "report"
    INFO = "info"


class ReasoningStep(BaseModel):
    id: str = Field(default_factory=lambda: _id("step"))
    kind: ReasoningKind
    icon: str = "•"
    text: str
    created_at: int = Field(default_factory=_now_ms)


# ─────────────────────────────────────────────────────────────────────────
# Remediation actions
# ─────────────────────────────────────────────────────────────────────────
class ActionMode(str, Enum):
    AUTO = "auto"            # safe, ARIA executes automatically
    NEEDS_APPROVAL = "needs_approval"  # risky, requires a human click


class ActionStatus(str, Enum):
    PROPOSED = "proposed"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXECUTING = "executing"
    DONE = "done"
    FAILED = "failed"


class RemediationAction(BaseModel):
    id: str = Field(default_factory=lambda: _id("act"))
    title: str
    description: str = ""
    mode: ActionMode = ActionMode.NEEDS_APPROVAL
    status: ActionStatus = ActionStatus.PROPOSED
    # Which tool would run this, for transparency in the UI.
    tool: str = ""
    result: str = ""


# ─────────────────────────────────────────────────────────────────────────
# Incident
# ─────────────────────────────────────────────────────────────────────────
class IncidentPhase(str, Enum):
    CALM = "calm"
    DETECTED = "detected"
    REASONING = "reasoning"
    AWAITING_APPROVAL = "awaiting_approval"
    REMEDIATING = "remediating"
    RESOLVED = "resolved"


class RootCause(BaseModel):
    summary: str = ""
    confidence: float = 0.0  # 0..1
    causal_chain: list[str] = Field(default_factory=list)
    crosses_boundary: bool = False  # the magic: does it span infra + model?


class Incident(BaseModel):
    id: str = Field(default_factory=lambda: _id("inc"))
    title: str
    phase: IncidentPhase = IncidentPhase.DETECTED
    scenario: str = ""
    created_at: int = Field(default_factory=_now_ms)
    updated_at: int = Field(default_factory=_now_ms)

    signals: list[Signal] = Field(default_factory=list)
    reasoning: list[ReasoningStep] = Field(default_factory=list)
    root_cause: RootCause = Field(default_factory=RootCause)
    actions: list[RemediationAction] = Field(default_factory=list)
    report: str = ""
    # True when signals should be (or were) pulled live from the MCP servers.
    live_signals: bool = False

    def touch(self) -> None:
        self.updated_at = _now_ms()


# ─────────────────────────────────────────────────────────────────────────
# SSE event envelope
# ─────────────────────────────────────────────────────────────────────────
class StreamEvent(BaseModel):
    """Everything the backend pushes to the dashboard is one of these."""

    type: Literal[
        "phase",
        "signal",
        "reasoning",
        "root_cause",
        "action",
        "action_update",
        "report",
        "done",
        "error",
    ]
    incident_id: str
    payload: dict[str, Any] = Field(default_factory=dict)
    ts: int = Field(default_factory=_now_ms)
