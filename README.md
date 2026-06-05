<div align="center">

# ARIA — Autonomous Reasoning & Incident Agent

**One agent. Full-stack AI observability. Zero 3am pages.**

ARIA correlates **infrastructure signals (Dynatrace)** with **LLM quality signals (Arize Phoenix)** to find incidents that cross the infra/model boundary — the kind no single dashboard would ever catch — then plans and executes remediation under human oversight.

Built for the **Google Cloud Rapid Agent Hackathon** · Powered by **Gemini 3** + **Google ADK** · Partner tracks: **Dynatrace** & **Arize**

</div>

---

## The insight

Every team shipping AI to production runs two separate observability stacks:

- **Infra observability** (Dynatrace) — CPU, memory, pods, latency, traces, anomalies
- **LLM observability** (Arize Phoenix) — hallucination rate, eval scores, token usage, model latency

Nobody watches the *seam* between them. But the nastiest production incidents live exactly there:

> A memory leak on `aria-prod-3` causes context-window truncation → the model receives clipped prompts → hallucination rate climbs 340%. The infra team sees "high memory." The ML team sees "model degraded." **Neither sees the causal chain.**

ARIA reasons across **both** systems at once, names the root cause with a confidence score, and closes the loop.

## What ARIA does

```
Anomaly detected (infra OR model)
   → ARIA pulls context from Dynatrace + Arize Phoenix
   → Reasons across both signal sets simultaneously (Gemini 3)
   → Identifies root cause + confidence score
   → Plans the minimum remediation
   → Executes AUTO actions; pauses for human approval on risky ones
   → Drafts the incident report and closes the loop
```

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      ARIA Frontend                         │
│            Ops Dashboard (Next.js + Tailwind)              │
│   Live incident feed │ Reasoning chain │ Approve button    │
└───────────────────────────┬───────────────────────────────┘
                            │  SSE stream + REST
┌───────────────────────────▼───────────────────────────────┐
│                  ARIA Backend (FastAPI)                    │
│                                                            │
│        Google ADK multi-agent · Gemini 3 brain            │
│   ┌──────────┐    ┌───────────┐    ┌────────────┐         │
│   │ Planner  │ →  │ Reasoner  │ →  │ Executor   │         │
│   │ breaks   │    │ correlates│    │ runs       │         │
│   │ the goal │    │ infra+LLM │    │ approved   │         │
│   │ to steps │    │ signals   │    │ actions    │         │
│   └──────────┘    └───────────┘    └────────────┘         │
└──────┬────────────────────────────────────┬───────────────┘
       │ MCP                                 │ MCP
┌──────▼───────┐                    ┌────────▼────────┐
│ Arize Phoenix│                    │   Dynatrace     │
│  MCP Server  │                    │   MCP Server    │
│ • LLM traces │                    │ • metrics/logs  │
│ • hallucina- │                    │ • problems      │
│   tion rate  │                    │ • anomalies     │
│ • evals      │                    │ • k8s events    │
└──────────────┘                    └─────────────────┘
```

## Dual-mode: always demoable, fully live when you want it

ARIA runs in two modes with the **same agent pipeline**:

| Mode | Observability signals | Reasoning brain | Use it for |
|------|----------------------|-----------------|------------|
| **Demo** (default) | Synthetic incident engine | Real Gemini 3 if `GOOGLE_API_KEY` set, else scripted | Recording the video, local dev, no accounts needed |
| **Live** | Real Dynatrace + Arize Phoenix via MCP | Gemini 3 via ADK | Connecting to your real stack |

Set credentials in `.env` and flip `ARIA_MODE=live`. Nothing else changes.

## Quickstart

### Backend
```bash
cd aria/backend
uv venv && source .venv/bin/activate      # or: python3 -m venv .venv && source .venv/bin/activate
uv pip install -e .                        # or: pip install -e .
cp ../.env.example .env                     # optional: add GOOGLE_API_KEY for real reasoning
uvicorn aria.server:app --reload --port 8000
```

### Frontend
```bash
cd aria/frontend
npm install
npm run dev          # http://localhost:3000
```

Open the dashboard, click **Inject Incident**, and watch ARIA wake up.

## Demo arc (the 3-minute video)

1. **The Calm** — all green, ARIA watching quietly.
2. **The Incident** — inject a memory leak; Dynatrace + Arize panels light up together.
3. **ARIA Wakes Up** — reasoning chain streams live, correlates the cross-layer cause, scores confidence.
4. **Human in the Loop** — operator approves the prompt-template fix; ARIA executes; metrics normalize.
5. **The Report** — ARIA drafts a full incident report, one click to Slack/email.

## Tech stack

| Layer | Tech |
|-------|------|
| Agent orchestration | Google ADK (Agent Builder) |
| LLM brain | Gemini 3 (configurable via `ARIA_MODEL`) |
| AI observability | Arize Phoenix MCP |
| Infra observability | Dynatrace MCP |
| Backend | Python · FastAPI · SSE |
| Frontend | Next.js · React · Tailwind |
| Hosting | Google Cloud Run |

## Repository layout

```
aria/
├── backend/         FastAPI app, ADK agents, MCP toolsets, synthetic engine
│   └── aria/
│       ├── agents/        Planner · Reasoner · Executor · Orchestrator
│       ├── tools/         MCP wiring, synthetic signals, remediation actions
│       ├── prompts.py     The cross-signal correlation prompt (core IP)
│       ├── incident.py    Incident + signal models, confidence scoring
│       ├── engine.py      Demo/live reasoning engine
│       └── server.py      FastAPI: SSE reasoning stream + approval API
├── frontend/        Next.js + Tailwind ops dashboard
├── LICENSE          Apache-2.0
└── .env.example
```

## License

Apache-2.0 — see [LICENSE](./LICENSE).
