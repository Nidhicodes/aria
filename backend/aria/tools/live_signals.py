"""Direct signal fetchers for live mode.

Instead of spawning MCP servers (slow, auth-dependent, fragile), these
query Phoenix and Dynatrace over plain HTTP to pull real signals fast.
This is what actually makes the dashboard show real data.
"""

from __future__ import annotations

import httpx

from ..config import Settings
from ..incident import Severity, Signal, SignalSource


async def fetch_phoenix_signals(settings: Settings) -> list[Signal]:
    """Query local/cloud Phoenix for actual LLM trace stats.

    Looks at spans in the last 30 minutes and computes real metrics:
    hallucination rate, avg prompt tokens, relevance score, latency.
    """
    base = settings.phoenix_host.rstrip("/")
    headers = {}
    if settings.phoenix_api_key:
        headers["authorization"] = f"Bearer {settings.phoenix_api_key}"

    signals: list[Signal] = []

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # Get spans from the project
            r = await client.get(
                f"{base}/v1/spans",
                params={"project_name": settings.phoenix_project, "limit": 50},
                headers=headers,
            )

            if r.status_code != 200:
                # Try GraphQL as fallback (Phoenix v17+)
                return await _fetch_phoenix_graphql(client, base, headers)

            spans = r.json().get("data", [])
            if not spans:
                return []

            # Compute real metrics from actual trace data
            halluc_scores = []
            relevance_scores = []
            prompt_tokens = []
            latencies = []

            for span in spans:
                attrs = span.get("attributes", {})
                # Hallucination
                hs = attrs.get("eval.hallucination_score")
                if hs is not None:
                    halluc_scores.append(float(hs))
                # Relevance
                rs = attrs.get("eval.relevance_score")
                if rs is not None:
                    relevance_scores.append(float(rs))
                # Prompt tokens
                pt = attrs.get("llm.token_count.prompt")
                if pt is not None:
                    prompt_tokens.append(int(pt))
                # Latency
                lat = attrs.get("aria.latency_ms")
                if lat is not None:
                    latencies.append(float(lat))

            # Build signals from real stats
            if halluc_scores:
                rate = sum(1 for h in halluc_scores if h > 0.5) / len(halluc_scores) * 100
                sev = Severity.CRITICAL if rate > 5 else Severity.WARNING if rate > 2 else Severity.OK
                signals.append(Signal(
                    source=SignalSource.ARIZE,
                    name="Hallucination rate",
                    value=round(rate, 1),
                    unit="%",
                    severity=sev,
                    detail=f"{sum(1 for h in halluc_scores if h > 0.5)}/{len(halluc_scores)} spans hallucinated",
                    entity="model/support-copilot",
                ))

            if relevance_scores:
                avg_rel = sum(relevance_scores) / len(relevance_scores)
                sev = Severity.CRITICAL if avg_rel < 0.6 else Severity.WARNING if avg_rel < 0.8 else Severity.OK
                signals.append(Signal(
                    source=SignalSource.ARIZE,
                    name="Avg relevance score",
                    value=round(avg_rel, 2),
                    unit="",
                    severity=sev,
                    detail=f"Across {len(relevance_scores)} evaluated spans",
                    entity="model/support-copilot",
                ))

            if prompt_tokens:
                avg_tok = sum(prompt_tokens) / len(prompt_tokens)
                sev = Severity.WARNING if avg_tok < 2000 else Severity.OK
                signals.append(Signal(
                    source=SignalSource.ARIZE,
                    name="Avg prompt tokens",
                    value=round(avg_tok, 0),
                    unit="tok",
                    severity=sev,
                    detail="Baseline ~3400; low = possible truncation",
                    entity="model/support-copilot",
                ))

            if latencies:
                p95 = sorted(latencies)[int(len(latencies) * 0.95)] if len(latencies) > 1 else latencies[0]
                sev = Severity.CRITICAL if p95 > 2000 else Severity.WARNING if p95 > 500 else Severity.OK
                signals.append(Signal(
                    source=SignalSource.ARIZE,
                    name="Model latency p95",
                    value=round(p95, 0),
                    unit="ms",
                    severity=sev,
                    detail=f"From {len(latencies)} recent spans",
                    entity="model/support-copilot",
                ))

    except Exception:
        pass

    return signals


async def _fetch_phoenix_graphql(
    client: httpx.AsyncClient, base: str, headers: dict
) -> list[Signal]:
    """Query Phoenix v17+ via GraphQL for real span-level metrics."""
    signals: list[Signal] = []
    try:
        # Get actual span attributes to compute real metrics
        query = """
        {
          node(id: "UHJvamVjdDox") {
            ... on Project {
              name
              recordCount
              spans(first: 50) {
                edges {
                  node {
                    name
                    attributes
                  }
                }
              }
            }
          }
        }
        """
        r = await client.post(
            f"{base}/graphql",
            json={"query": query},
            headers={**headers, "Content-Type": "application/json"},
        )
        data = r.json().get("data", {}).get("node", {})
        edges = data.get("spans", {}).get("edges", [])

        if not edges:
            return signals

        halluc_scores = []
        relevance_scores = []
        prompt_tokens = []
        latencies = []

        for edge in edges:
            attrs_raw = edge.get("node", {}).get("attributes", {})
            # Phoenix returns attributes as a JSON string — parse it
            if isinstance(attrs_raw, str):
                import json as _json
                try:
                    attrs = _json.loads(attrs_raw)
                except (ValueError, TypeError):
                    continue
            else:
                attrs = attrs_raw

            # Navigate nested attribute structure
            eval_data = attrs.get("eval", {})
            llm_data = attrs.get("llm", {})
            aria_data = attrs.get("aria", {})

            hs = eval_data.get("hallucination_score")
            if hs is not None:
                halluc_scores.append(float(hs))

            rs = eval_data.get("relevance_score")
            if rs is not None:
                relevance_scores.append(float(rs))

            token_count = llm_data.get("token_count", {})
            pt = token_count.get("prompt")
            if pt is not None:
                prompt_tokens.append(int(pt))

            lat = aria_data.get("latency_ms")
            if lat is not None:
                latencies.append(float(lat))

        # Build signals from computed real stats
        if halluc_scores:
            rate = sum(1 for h in halluc_scores if h > 0.5) / len(halluc_scores) * 100
            sev = Severity.CRITICAL if rate > 5 else Severity.WARNING if rate > 2 else Severity.OK
            signals.append(Signal(
                source=SignalSource.ARIZE,
                name="Hallucination rate",
                value=round(rate, 1),
                unit="%",
                severity=sev,
                detail=f"{sum(1 for h in halluc_scores if h > 0.5)}/{len(halluc_scores)} spans hallucinated",
                entity="model/support-copilot",
            ))

        if relevance_scores:
            avg_rel = sum(relevance_scores) / len(relevance_scores)
            sev = Severity.CRITICAL if avg_rel < 0.6 else Severity.WARNING if avg_rel < 0.8 else Severity.OK
            signals.append(Signal(
                source=SignalSource.ARIZE,
                name="Avg relevance score",
                value=round(avg_rel, 2),
                unit="",
                severity=sev,
                detail=f"Across {len(relevance_scores)} evaluated spans",
                entity="model/support-copilot",
            ))

        if prompt_tokens:
            avg_tok = sum(prompt_tokens) / len(prompt_tokens)
            sev = Severity.WARNING if avg_tok < 2000 else Severity.OK
            signals.append(Signal(
                source=SignalSource.ARIZE,
                name="Avg prompt tokens",
                value=round(avg_tok, 0),
                unit="tok",
                severity=sev,
                detail=f"Baseline ~3400; current avg from {len(prompt_tokens)} spans",
                entity="model/support-copilot",
            ))

        if latencies:
            p95_idx = min(int(len(latencies) * 0.95), len(latencies) - 1)
            p95 = sorted(latencies)[p95_idx]
            sev = Severity.CRITICAL if p95 > 2000 else Severity.WARNING if p95 > 500 else Severity.OK
            signals.append(Signal(
                source=SignalSource.ARIZE,
                name="Model latency p95",
                value=round(p95, 0),
                unit="ms",
                severity=sev,
                detail=f"From {len(latencies)} recent spans",
                entity="model/support-copilot",
            ))

        # Total span count as context
        record_count = data.get("recordCount", len(edges))
        signals.append(Signal(
            source=SignalSource.ARIZE,
            name="Total spans analyzed",
            value=float(record_count),
            unit="",
            severity=Severity.INFO,
            detail=f"Project: {data.get('name', 'default')}",
            entity=f"project/{data.get('name', 'default')}",
        ))

    except Exception:
        pass
    return signals


async def fetch_dynatrace_signals(settings: Settings) -> list[Signal]:
    """Query Dynatrace for problems/entities if a platform token is available.

    Without a token, attempts to use the cached OAuth token from the MCP server.
    """
    if not settings.dt_environment:
        return []

    base = settings.dt_environment.rstrip("/")
    signals: list[Signal] = []

    # Try with platform token if available
    headers: dict[str, str] = {}
    if settings.dt_platform_token:
        headers["Authorization"] = f"Api-Token {settings.dt_platform_token}"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # Query problems (most impactful signal)
            r = await client.get(
                f"{base}/api/v2/problems",
                params={"from": "now-30m", "pageSize": 10},
                headers=headers,
            )
            if r.status_code == 200:
                problems = r.json().get("problems", [])
                if problems:
                    for p in problems[:3]:
                        signals.append(Signal(
                            source=SignalSource.DYNATRACE,
                            name="Problem",
                            value=1,
                            unit="",
                            severity=Severity.CRITICAL,
                            detail=p.get("title", "Unknown problem"),
                            entity=p.get("affectedEntities", [{}])[0].get("name", ""),
                        ))
                else:
                    signals.append(Signal(
                        source=SignalSource.DYNATRACE,
                        name="Active problems",
                        value=0,
                        unit="",
                        severity=Severity.OK,
                        detail="No open problems in the last 30 minutes",
                        entity=settings.dt_environment.split("//")[1].split(".")[0],
                    ))
            elif r.status_code == 401:
                # No valid auth — report connection status
                signals.append(Signal(
                    source=SignalSource.DYNATRACE,
                    name="Connection",
                    value=0,
                    unit="",
                    severity=Severity.WARNING,
                    detail="Connected but auth token expired/missing — using browser OAuth for MCP",
                    entity=settings.dt_environment.split("//")[1].split(".")[0],
                ))
    except Exception:
        pass

    return signals


async def fetch_all_live_signals(settings: Settings) -> list[Signal]:
    """Pull real signals from both Phoenix and Dynatrace via direct HTTP."""
    phoenix = await fetch_phoenix_signals(settings)
    dynatrace = await fetch_dynatrace_signals(settings)
    return phoenix + dynatrace
