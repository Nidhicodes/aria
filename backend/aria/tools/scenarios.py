"""Synthetic incident scenarios for ARIA's demo mode.

Each scenario produces a realistic set of cross-layer signals — infra signals
from "Dynatrace" and model signals from "Arize Phoenix" — that genuinely
require correlation across the two systems to explain. This is what makes the
demo land: the root cause is invisible to either dashboard alone.

In ``live`` mode these are replaced by real MCP tool calls (see mcp_tools.py),
but the scenarios also serve as a ground-truth fixture for tests.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from ..incident import Severity, Signal, SignalSource


@dataclass
class Scenario:
    key: str
    title: str
    blurb: str
    # The "calm" baseline shown before injection.
    baseline: list[Signal] = field(default_factory=list)
    # The signals that light up when the incident is injected.
    incident_signals: list[Signal] = field(default_factory=list)
    # The known-good answer (used as a reasoning hint + test oracle).
    expected_root_cause: str = ""
    expected_chain: list[str] = field(default_factory=list)


def _sig(source: SignalSource, name: str, value: float, unit: str,
         severity: Severity, detail: str, entity: str = "") -> Signal:
    return Signal(
        source=source, name=name, value=value, unit=unit,
        severity=severity, detail=detail, entity=entity,
    )


# ─────────────────────────────────────────────────────────────────────────
# Scenario 1: the hero demo — memory leak → truncation → hallucination
# ─────────────────────────────────────────────────────────────────────────
MEMORY_HALLUCINATION = Scenario(
    key="memory_hallucination",
    title="Memory pressure driving LLM hallucinations",
    blurb=(
        "A memory leak on pod aria-prod-3 is forcing context-window truncation, "
        "so the model receives clipped prompts and hallucination rate is climbing."
    ),
    baseline=[
        _sig(SignalSource.DYNATRACE, "Memory utilization", 61, "%", Severity.OK,
             "Steady within normal range", "pod/aria-prod-3"),
        _sig(SignalSource.DYNATRACE, "Request latency p95", 240, "ms", Severity.OK,
             "Nominal", "svc/inference-gateway"),
        _sig(SignalSource.ARIZE, "Hallucination rate", 2.1, "%", Severity.OK,
             "Within baseline", "model/support-copilot"),
        _sig(SignalSource.ARIZE, "Answer-relevance eval", 0.94, "", Severity.OK,
             "Healthy", "model/support-copilot"),
    ],
    incident_signals=[
        _sig(SignalSource.DYNATRACE, "Memory utilization", 94, "%", Severity.CRITICAL,
             "Sustained climb over 15m, no GC recovery — leak signature",
             "pod/aria-prod-3"),
        _sig(SignalSource.DYNATRACE, "Problem", 1, "", Severity.CRITICAL,
             "Davis detected: memory saturation on aria-prod-3",
             "pod/aria-prod-3"),
        _sig(SignalSource.DYNATRACE, "Prompt-assembly buffer evictions", 38, "/min",
             Severity.WARNING,
             "Buffer evicting context fragments under memory pressure",
             "svc/prompt-builder"),
        _sig(SignalSource.ARIZE, "Hallucination rate", 9.3, "%", Severity.CRITICAL,
             "Up 340% in last 15m", "model/support-copilot"),
        _sig(SignalSource.ARIZE, "Avg prompt tokens", 1180, "tok", Severity.WARNING,
             "Down from ~3400 baseline — prompts arriving truncated",
             "model/support-copilot"),
        _sig(SignalSource.ARIZE, "Answer-relevance eval", 0.71, "", Severity.WARNING,
             "Regressed from 0.94", "model/support-copilot"),
    ],
    expected_root_cause=(
        "A memory leak on pod aria-prod-3 is causing the prompt-assembly buffer "
        "to evict context, truncating prompts sent to the model, which drives "
        "the hallucination-rate spike."
    ),
    expected_chain=[
        "Memory leak on aria-prod-3 reaches 94% utilization",
        "Prompt-assembly buffer evicts context fragments under pressure",
        "Model receives truncated prompts (avg tokens 3400 → 1180)",
        "Truncated context degrades grounding → hallucination rate +340%",
    ],
)

# ─────────────────────────────────────────────────────────────────────────
# Scenario 2: CPU throttle → latency → client timeouts
# ─────────────────────────────────────────────────────────────────────────
CPU_TIMEOUT = Scenario(
    key="cpu_timeout",
    title="CPU throttling cascading into model timeouts",
    blurb=(
        "A noisy-neighbor CPU throttle on the inference node is backing up the "
        "request queue, spiking model latency and tripping client-side timeouts."
    ),
    baseline=[
        _sig(SignalSource.DYNATRACE, "CPU throttled time", 0.4, "%", Severity.OK,
             "Negligible throttling", "node/gke-infer-2"),
        _sig(SignalSource.ARIZE, "Model latency p95", 1.9, "s", Severity.OK,
             "Nominal", "model/support-copilot"),
    ],
    incident_signals=[
        _sig(SignalSource.DYNATRACE, "CPU throttled time", 47, "%", Severity.CRITICAL,
             "Severe throttling from co-located batch job", "node/gke-infer-2"),
        _sig(SignalSource.DYNATRACE, "Inference queue depth", 320, "req",
             Severity.WARNING, "Queue backing up, was ~12", "svc/inference-gateway"),
        _sig(SignalSource.ARIZE, "Model latency p95", 11.4, "s", Severity.CRITICAL,
             "6x baseline", "model/support-copilot"),
        _sig(SignalSource.ARIZE, "Timeout/error rate", 18.0, "%", Severity.CRITICAL,
             "Clients abandoning at 10s deadline", "model/support-copilot"),
    ],
    expected_root_cause=(
        "CPU throttling from a co-located batch job on node gke-infer-2 is backing "
        "up the inference queue, spiking model latency past the client timeout."
    ),
    expected_chain=[
        "Co-located batch job throttles CPU to 47% on gke-infer-2",
        "Inference queue depth climbs from 12 to 320 requests",
        "Model latency p95 rises to 11.4s (6x baseline)",
        "Clients hit 10s deadline → 18% timeout/error rate",
    ],
)

# ─────────────────────────────────────────────────────────────────────────
# Scenario 3: bad deploy → cold cache → eval regression
# ─────────────────────────────────────────────────────────────────────────
DEPLOY_REGRESSION = Scenario(
    key="deploy_regression",
    title="Rollout restart loop regressing eval scores",
    blurb=(
        "A bad config in the latest rollout is crash-looping pods, repeatedly "
        "cold-starting the retrieval cache and regressing answer quality."
    ),
    baseline=[
        _sig(SignalSource.DYNATRACE, "Pod restarts", 0, "/15m", Severity.OK,
             "Stable", "deploy/support-copilot"),
        _sig(SignalSource.ARIZE, "Retrieval-hit eval", 0.91, "", Severity.OK,
             "Healthy grounding", "model/support-copilot"),
    ],
    incident_signals=[
        _sig(SignalSource.DYNATRACE, "Pod restarts", 14, "/15m", Severity.CRITICAL,
             "CrashLoopBackOff after rollout v2.7.1", "deploy/support-copilot"),
        _sig(SignalSource.DYNATRACE, "Readiness probe failures", 22, "/15m",
             Severity.WARNING, "Cache warm-up never completes", "deploy/support-copilot"),
        _sig(SignalSource.ARIZE, "Retrieval-hit eval", 0.46, "", Severity.CRITICAL,
             "Half of answers ungrounded", "model/support-copilot"),
        _sig(SignalSource.ARIZE, "Hallucination rate", 7.7, "%", Severity.WARNING,
             "Climbing as retrieval misses rise", "model/support-copilot"),
    ],
    expected_root_cause=(
        "Rollout v2.7.1 is crash-looping pods before the retrieval cache warms, "
        "so answers go ungrounded and eval scores regress."
    ),
    expected_chain=[
        "Rollout v2.7.1 introduces a bad config → CrashLoopBackOff",
        "Pods restart 14x/15m; retrieval cache never warms",
        "Retrieval-hit eval drops 0.91 → 0.46",
        "Ungrounded answers push hallucination rate up",
    ],
)


SCENARIOS: dict[str, Scenario] = {
    s.key: s for s in (MEMORY_HALLUCINATION, CPU_TIMEOUT, DEPLOY_REGRESSION)
}

DEFAULT_SCENARIO = MEMORY_HALLUCINATION.key


def get_scenario(key: str | None) -> Scenario:
    if not key:
        return SCENARIOS[DEFAULT_SCENARIO]
    return SCENARIOS.get(key, SCENARIOS[DEFAULT_SCENARIO])


def list_scenarios() -> list[dict]:
    return [
        {"key": s.key, "title": s.title, "blurb": s.blurb}
        for s in SCENARIOS.values()
    ]
