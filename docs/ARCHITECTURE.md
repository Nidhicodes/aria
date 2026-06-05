# ARIA architecture

## The core insight

Two production observability stacks, never correlated:

- **Dynatrace** → infrastructure (CPU, memory, pods, latency, problems, k8s events)
- **Arize Phoenix** → model quality (hallucination rate, evals, token usage, traces)

ARIA reasons across both at once to find **cross-boundary causal chains** — the
incidents that are invisible to either dashboard alone.

## System diagram

```
 Browser
   │  SSE (reasoning stream) + REST (inject / approve)
   ▼
 Next.js dashboard  ──────────────────────────────────────────────┐
   • dual signal panels (Dynatrace | Arize)                        │
   • live reasoning chain + confidence gauge                       │
   • approve / reject controls                                     │
                                                                   │
 FastAPI backend (aria.server)                                     │
   │                                                               │
   ├── IncidentEngine (aria.engine)                                │
   │     state machine: detected → reasoning → awaiting_approval   │
   │                    → remediating → resolved                   │
   │     emits StreamEvents over SSE                               │
   │                                                               │
   ├── reasoning backend selection:                                │
   │     live  → ADK pipeline (Planner→Reasoner→Executor + MCP)    │
   │     keyed → direct Gemini correlation call                    │
   │     none  → scripted fallback (always works)                  │
   │                                                               │
   └── tools/                                                      │
         scenarios.py    synthetic cross-layer incidents (demo)    │
         mcp_tools.py    Dynatrace + Arize Phoenix MCP toolsets    │
         remediation.py  non-destructive action execution         │
                                                                   ▼
 Live mode: Gemini 3 (Google ADK) ──► Dynatrace MCP + Arize Phoenix MCP
```

## Request lifecycle (one incident)

1. `POST /api/incidents/inject` creates an `Incident` from a scenario (or, in
   live mode, from a real anomaly trigger).
2. The client opens `GET /api/incidents/{id}/stream` (SSE).
3. `IncidentEngine.run` walks the state machine, emitting `StreamEvent`s:
   `phase` → `signal*` → `reasoning*` → `root_cause` → `action*` →
   `action_update*` → `report` → `done`.
4. For `NEEDS_APPROVAL` actions the engine blocks on an `asyncio.Event` until the
   client calls `.../approve` or `.../reject`.
5. The report is generated (Gemini or scripted) and streamed; phase → `resolved`.

## Why a state machine + SSE

Incident response is inherently a streaming, human-gated process. SSE gives the
dashboard a live "thought process" view with no polling, and the approval gate
is a first-class state — not an afterthought. This directly satisfies the
hackathon's "multi-step mission, human in control" requirement.

## Dual mode

The reasoning backend is selected at runtime (`aria.engine._diagnose`) with
graceful degradation: live ADK pipeline → direct Gemini → scripted. The product
never hard-fails, and the same UI/architecture serves both the recorded demo and
a real production hookup.
```
