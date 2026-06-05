# Live mode — connecting real Dynatrace + Arize Phoenix

ARIA's architecture is identical in demo and live mode. The difference is only
*where the signals come from* and *what runs the reasoning*:

| | Demo | Live |
|---|---|---|
| Infra signals | synthetic scenario | **pulled live** from Dynatrace MCP |
| Model signals | synthetic scenario | **pulled live** from Arize Phoenix MCP |
| Reasoning | Gemini if keyed, else scripted | Gemini via Google ADK |
| Remediation | simulated | simulated by default (see "Real actions") |

## What happens when you click "Inject Incident" in live mode

1. ARIA spins up an ADK **collector agent** with both partner MCP toolsets and
   asks it to pull the current cross-layer state (last 30 min). The agent calls
   the real Dynatrace and Arize tools and returns the live signals — these
   replace the scenario placeholder and render on the dashboard.
2. The **Planner → Reasoner → Executor** pipeline (also MCP-equipped) correlates
   those real signals and produces the root cause + confidence.
3. Proposed actions stream in; AUTO ones run, NEEDS_APPROVAL ones wait for your
   click.

If any live step fails (no creds, network, tool error), ARIA transparently
falls back to the scenario fixture so the demo never hard-fails.

```python
# aria/tools/mcp_tools.py
McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command="npx",
            args=["-y", "@dynatrace-oss/dynatrace-mcp-server@latest"],
            env={"DT_ENVIRONMENT": ..., "DT_PLATFORM_TOKEN": ...},
        ),
        timeout=60,
    ),
)
```

### Dynatrace MCP tools ARIA uses
`list_problems`, `list_exceptions`, `get_kubernetes_events`, `execute_dql`,
`find_entity_by_name`, and for remediation/notification `send_event` and
`send_slack_message`.

### Arize Phoenix MCP tools ARIA uses
`list-projects`, `list-traces`, `get-trace`, `get-spans`,
`get-span-annotations`, `list-experiments-for-dataset`.

## Enabling it

1. Install the ADK extra:
   ```bash
   pip install ".[adk]"   # google-adk + google-genai
   ```
2. Ensure Node ≥ 22 is on PATH (the MCP servers run via `npx`).
3. Fill `.env`:
   ```ini
   ARIA_MODE=live
   GOOGLE_API_KEY=...                 # or Vertex AI vars
   DT_ENVIRONMENT=https://abc12345.apps.dynatrace.com
   DT_PLATFORM_TOKEN=dt0s16...
   PHOENIX_HOST=https://app.phoenix.arize.com
   PHOENIX_API_KEY=...
   ```
4. Start the backend. `GET /api/health` will report which integrations are live.

## Cost note (Dynatrace Grail)

`execute_dql` queries scan Grail storage and can incur cost. ARIA keeps query
windows to 30 minutes by default. See Dynatrace's `DT_GRAIL_QUERY_BUDGET_GB`
setting to cap session spend.

## Making remediation real (optional)

By default ARIA *simulates* remediation, because a demo should never actually
roll back your production. To execute real actions, edit
`aria/tools/remediation.py` — the `execute_action` function is the single
choke-point. In live mode you can map action titles to real tool calls:

- **Notify / page** → Dynatrace `send_slack_message` or `send_email`
- **Mark an event** → Dynatrace `send_event`
- **Scale / rollback / config push** → call your own deploy webhook, kubectl
  proxy, or CI trigger here

Keep destructive actions behind the existing `NEEDS_APPROVAL` gate so a human
always clicks first. The approval gate in `engine.py` already blocks execution
until `/approve` is called.

## Integrating ARIA with your own AI platform

ARIA is two independent pieces you can adopt separately:

### 1. Use ARIA's backend as a service
The FastAPI backend is a normal HTTP + SSE service. Any platform can drive it:

```
POST /api/incidents/inject            → start an incident investigation
GET  /api/incidents/{id}/stream       → SSE: phase, signal, reasoning,
                                          root_cause, action, report, done
POST /api/incidents/{id}/actions/{actionId}/approve
POST /api/incidents/{id}/actions/{actionId}/reject
```

Point `NEXT_PUBLIC_ARIA_API` (or your own client) at the deployed URL and you
get the full reasoning stream and human-in-the-loop gate over standard web
protocols — no coupling to our frontend.

### 2. Reuse the agent pipeline inside your stack
ARIA's brain is plain Google ADK agents (`aria/agents/pipeline.py`). To embed it
in your own agent platform:

- **As ADK sub-agents**: import `build_root_agent(settings)` and mount the
  Planner/Reasoner/Executor as sub-agents of your existing ADK root agent.
- **As an A2A service**: ADK agents can be exposed over the Agent-to-Agent (A2A)
  protocol, so another platform's agents can call ARIA as a discoverable
  "incident responder" agent.
- **Bring your own tools**: `aria/tools/mcp_tools.py` builds the partner MCP
  toolsets. Add your own `McpToolset` entries (PagerDuty, GitHub, Slack,
  internal MCP servers) to `build_all_toolsets` and ARIA will reason over them
  too — the cross-layer correlation prompt is tool-agnostic.

### 3. Swap the model
`ARIA_MODEL` selects the Gemini model. Set `GOOGLE_GENAI_USE_VERTEXAI=true` with
`GOOGLE_CLOUD_PROJECT` to route through Vertex AI (recommended for production /
enterprise quotas) instead of the Gemini API.
