# ARIA — Devpost Submission

> **One agent. Full-stack AI observability. Zero 3am pages.**

## Inspiration

Every team shipping AI to production runs two observability stacks that never
talk to each other: **infrastructure monitoring** (Dynatrace) and **LLM
monitoring** (Arize Phoenix). The infra team watches CPU, memory, and pods. The
ML team watches hallucination rate and eval scores. Nobody watches the seam
between them — and that's exactly where the worst incidents hide.

A memory leak doesn't look like a model problem. A spiking hallucination rate
doesn't look like an infra problem. But when a memory leak quietly truncates the
context window feeding your model, the two are the *same* incident — and no
single dashboard will ever connect them. That blind spot is what wakes engineers
up at 3am. ARIA was built to close it.

## What it does

ARIA is an autonomous incident-response agent that reasons across **both**
observability layers at once. When an anomaly fires, it:

1. Pulls infrastructure context from **Dynatrace** and model-quality context
   from **Arize Phoenix** over the same time window.
2. Correlates the two signal sets, hunting specifically for causal chains that
   cross the infra/model boundary.
3. Names a single root cause with a **confidence score**.
4. Proposes the minimum set of remediation actions, tagging each as **AUTO**
   (safe, self-executing) or **NEEDS APPROVAL** (a human clicks first).
5. Executes approved actions and drafts a complete incident report.

The hero scenario: a memory leak on `aria-prod-3` evicts the prompt-assembly
buffer → prompts arrive truncated (3400 → 1180 tokens) → hallucination rate
climbs 340%. ARIA connects all four links in seconds.

## How we built it

- **Brain:** Gemini 3 via **Google ADK**, structured as a Planner → Reasoner →
  Executor pipeline. The Reasoner carries both partner MCP toolsets, so a single
  Gemini agent can call Dynatrace and Arize Phoenix tools in one reasoning loop.
- **Partner superpowers (MCP):**
  - **Dynatrace MCP** — `list_problems`, `execute_dql`, `get_kubernetes_events`,
    `find_entity_by_name`, `send_event`, `send_slack_message`.
  - **Arize Phoenix MCP** — `list-traces`, `get-spans`, `get-span-annotations`,
    `list-experiments-for-dataset`.
- **Backend:** Python + FastAPI, streaming the live reasoning chain to the UI
  over Server-Sent Events, with a real human-in-the-loop approval gate.
- **Frontend:** Next.js + Tailwind ops dashboard — dual signal panels, a live
  reasoning chain, a confidence gauge, and approve/reject controls.
- **Hosting:** Containerized for **Google Cloud Run** (both services).

A key engineering decision: ARIA runs in a **dual mode**. In `demo` mode it
drives a synthetic-but-realistic cross-layer incident so the experience is
always reproducible for judging; in `live` mode it swaps in the real Dynatrace +
Arize Phoenix MCP servers and Gemini 3 — same agent pipeline, same UI, real
data. Nothing about the architecture changes.

## Challenges

- Designing incidents whose root cause is genuinely *invisible* to either system
  alone — that's what proves the cross-layer thesis.
- Streaming a reasoning chain that reads naturally on screen while keeping a real
  approval gate that blocks execution until a human decides.
- Making the project bulletproof for a recorded demo without sacrificing a real
  live integration path.

## Accomplishments

- A genuinely novel insight: correlating infra + LLM observability is something
  no single-vendor tool does today.
- One codebase that targets **two** partner tracks (Dynatrace and Arize) with a
  meaningful, expert integration of each.
- A polished, narrative demo: calm → crisis → reasoning → human approval →
  resolution → report.

## What's next

- Stream the model's token-level reasoning directly from Gemini into the chain.
- Learn remediation playbooks from resolved incidents.
- Expand the cross-layer correlation library (cost spikes, data drift, retrieval
  failures).

## Tracks

Dynatrace **and** Arize — ARIA integrates both partner MCP servers as first-class
tools.

## Links

- **Hosted demo:** _(Cloud Run URL)_
- **Code:** _(public repo URL)_ — Apache-2.0 licensed
- **Video:** _(3-minute demo)_
