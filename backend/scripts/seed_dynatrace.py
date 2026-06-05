"""Seed your Dynatrace environment with realistic infrastructure metrics.

This pushes custom metrics directly via the Dynatrace Metrics Ingest API v2.
No OneAgent needed — just your environment URL and an API token with
`metrics.ingest` scope (or the browser OAuth token that the MCP server cached).

Usage:
    python scripts/seed_dynatrace.py

It creates a 30-minute window of data simulating a memory leak + latency spike
on pod "aria-prod-3", so ARIA has something real to detect and correlate.
"""

import os
import sys
import time
from pathlib import Path

import httpx

# Load settings from .env
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from aria.config import Settings

settings = Settings()

DT_URL = settings.dt_environment.rstrip("/")
TOKEN = settings.dt_platform_token or os.environ.get("DT_PLATFORM_TOKEN", "")

if not DT_URL or DT_URL == "https://abc12345.apps.dynatrace.com":
    print("❌ Set DT_ENVIRONMENT in .env first")
    sys.exit(1)

INGEST_URL = f"{DT_URL}/api/v2/metrics/ingest"

# --- Metric lines (Dynatrace MINT protocol) ---
# We'll push 30 data points per metric, 1 per minute, simulating a 30-min window
# where memory climbs from 60% → 94% and latency from 200ms → 1200ms.

def build_lines():
    """Generate metric ingest lines for the memory leak scenario."""
    now = int(time.time())
    lines = []

    for i in range(30):
        ts_ms = (now - (30 - i) * 60) * 1000  # 30 min ago → now

        # Memory: ramps from 60 → 94 over 30 min
        mem = 60 + (34 * (i / 29) ** 1.8)
        lines.append(
            f"aria.pod.memory.utilization,pod=aria-prod-3,namespace=default gauge,{mem:.1f} {ts_ms}"
        )

        # Latency: ramps from 200 → 1200ms
        lat = 200 + (1000 * (i / 29) ** 2.0)
        lines.append(
            f"aria.service.latency.p95,service=inference-gateway gauge,{lat:.0f} {ts_ms}"
        )

        # Buffer evictions: 0 for first 15 min, then ramps to 38/min
        evictions = 0 if i < 15 else int(38 * ((i - 15) / 14))
        lines.append(
            f"aria.pod.buffer.evictions,pod=aria-prod-3,component=prompt-builder gauge,{evictions} {ts_ms}"
        )

        # Pod restart count: stays 0 (this scenario is memory, not crash-loop)
        lines.append(
            f"aria.pod.restarts,pod=aria-prod-3 gauge,0 {ts_ms}"
        )

    return "\n".join(lines)


def push_metrics():
    lines = build_lines()
    print(f"Pushing {lines.count(chr(10)) + 1} metric lines to {INGEST_URL}")

    headers = {"Content-Type": "text/plain; charset=utf-8"}
    if TOKEN:
        headers["Authorization"] = f"Api-Token {TOKEN}"
    else:
        print("⚠️  No DT_PLATFORM_TOKEN set — trying without auth (may fail)")

    resp = httpx.post(INGEST_URL, content=lines, headers=headers, timeout=30)

    if resp.status_code in (200, 202):
        print(f"✅ Metrics ingested successfully ({resp.status_code})")
        print(f"   Query them in Dynatrace with:")
        print(f'   fetch dt.metrics | filter key == "aria.pod.memory.utilization"')
    else:
        print(f"❌ Ingest failed: {resp.status_code}")
        print(f"   {resp.text[:300]}")
        if resp.status_code == 401:
            print("\n   Your token needs the 'metrics.ingest' scope.")
            print("   Or use browser OAuth: the MCP server cached a token at ~/.dynatrace-mcp/")


if __name__ == "__main__":
    push_metrics()
