"""ARIA FastAPI server.

Exposes:
  GET  /api/health             → status + which backends are live
  GET  /api/scenarios          → available demo incident scenarios
  GET  /api/baseline           → the "calm" baseline signals
  POST /api/incidents/inject   → create an incident, returns its id
  GET  /api/incidents          → list incidents
  GET  /api/incidents/{id}     → fetch one incident snapshot
  GET  /api/incidents/{id}/stream  → SSE reasoning stream (the live demo)
  POST /api/incidents/{id}/actions/{action_id}/approve
  POST /api/incidents/{id}/actions/{action_id}/reject
"""

from __future__ import annotations

import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from .config import get_settings
from .engine import IncidentEngine
from .tools import scenarios

settings = get_settings()
engine = IncidentEngine(settings)

app = FastAPI(
    title="ARIA — Autonomous Reasoning & Incident Agent",
    version="0.1.0",
    description=(
        "Correlates Dynatrace infrastructure signals with Arize Phoenix LLM "
        "signals via Gemini + Google ADK to detect and remediate cross-layer "
        "incidents."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class InjectRequest(BaseModel):
    scenario: str | None = None


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "mode": settings.aria_mode,
        "reasoning_backend": settings.reasoning_backend(),
        "model": settings.aria_model,
        "integrations": {
            "gemini": settings.has_gemini,
            "dynatrace": settings.has_dynatrace,
            "arize_phoenix": settings.has_phoenix,
        },
    }


@app.get("/api/scenarios")
def get_scenarios() -> dict:
    return {"scenarios": scenarios.list_scenarios()}


@app.get("/api/baseline")
def get_baseline(scenario: str | None = None) -> dict:
    sigs = engine.baseline_signals(scenario)
    return {"signals": [s.model_dump() for s in sigs]}


@app.post("/api/incidents/inject")
def inject(req: InjectRequest) -> dict:
    incident = engine.inject(req.scenario)
    return {"incident_id": incident.id, "incident": incident.model_dump()}


@app.get("/api/incidents")
def list_incidents() -> dict:
    return {"incidents": [i.model_dump() for i in engine.all()]}


@app.get("/api/incidents/{incident_id}")
def get_incident(incident_id: str) -> dict:
    incident = engine.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="incident not found")
    return incident.model_dump()


@app.get("/api/incidents/{incident_id}/stream")
async def stream(incident_id: str):
    incident = engine.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="incident not found")

    async def event_gen():
        async for event in engine.run(incident_id):
            yield {
                "event": event.type,
                "data": json.dumps(event.model_dump(), default=str),
            }

    return EventSourceResponse(event_gen())


@app.post("/api/incidents/{incident_id}/actions/{action_id}/approve")
def approve(incident_id: str, action_id: str) -> dict:
    if not engine.approve(incident_id, action_id):
        raise HTTPException(status_code=404, detail="incident or action not found")
    return {"ok": True, "action_id": action_id, "status": "approved"}


@app.post("/api/incidents/{incident_id}/actions/{action_id}/reject")
def reject(incident_id: str, action_id: str) -> dict:
    if not engine.reject(incident_id, action_id):
        raise HTTPException(status_code=404, detail="incident or action not found")
    return {"ok": True, "action_id": action_id, "status": "rejected"}


def main() -> None:
    import uvicorn

    uvicorn.run(
        "aria.server:app",
        host=settings.aria_host,
        port=settings.aria_port,
        reload=False,
    )


if __name__ == "__main__":
    main()
