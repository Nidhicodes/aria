"""Seed your Arize Phoenix instance with realistic LLM traces.

This sends OpenTelemetry traces to Phoenix Cloud using the OpenInference
semantic conventions — simulating an AI support copilot whose quality degrades
as prompts get truncated (matching the Dynatrace memory-leak scenario).

Usage:
    pip install arize-phoenix-otel openinference-semantic-conventions opentelemetry-sdk
    python scripts/seed_phoenix.py

It creates ~20 traces over a 30-minute window: the first 10 are healthy, the
last 10 show truncated prompts and hallucinated answers — giving ARIA real
Arize signals to detect.
"""

import os
import sys
import time
import random
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from aria.config import Settings

settings = Settings()

PHOENIX_HOST = settings.phoenix_host.rstrip("/")
PHOENIX_API_KEY = settings.phoenix_api_key
PROJECT = settings.phoenix_project or "default"

# Local Phoenix doesn't need a key; cloud does.
if not PHOENIX_API_KEY and "localhost" not in PHOENIX_HOST and "127.0.0.1" not in PHOENIX_HOST:
    print("❌ Set PHOENIX_API_KEY in .env first (not needed for local Phoenix)")
    sys.exit(1)

# Install deps inline if missing
try:
    from phoenix.otel import register
    from opentelemetry import trace
except ImportError:
    print("Installing required packages...")
    os.system(f"{sys.executable} -m pip install arize-phoenix-otel opentelemetry-sdk opentelemetry-exporter-otlp -q")
    from phoenix.otel import register
    from opentelemetry import trace


def seed():
    # Set env vars that phoenix.otel.register reads automatically
    os.environ["PHOENIX_COLLECTOR_ENDPOINT"] = PHOENIX_HOST
    if PHOENIX_API_KEY:
        os.environ["PHOENIX_API_KEY"] = PHOENIX_API_KEY
    os.environ["PHOENIX_PROJECT_NAME"] = PROJECT

    endpoint = f"{PHOENIX_HOST}/v1/traces"
    print(f"Registering tracer → {endpoint} (project: {PROJECT})")

    tracer_provider = register(
        endpoint=endpoint,
        project_name=PROJECT,
        protocol="http/protobuf",   # Force HTTP, not gRPC
        batch=True,
    )
    tracer = trace.get_tracer("aria-demo-app")

    now = time.time()
    traces_sent = 0

    for i in range(20):
        # Simulate timestamps spread over 30 minutes
        offset_s = (30 - i) * 90  # ~1.5 min apart
        start_time = now - offset_s

        is_degraded = i >= 10  # last 10 traces are degraded

        # Simulate an LLM span
        with tracer.start_as_current_span(
            name="llm.chat.completion",
            start_time=int(start_time * 1e9),
        ) as span:
            # Input/output token counts
            input_tokens = random.randint(800, 1200) if is_degraded else random.randint(3000, 3800)
            output_tokens = random.randint(150, 400)

            # Latency (degraded = slower due to retries)
            latency_ms = random.randint(800, 2400) if is_degraded else random.randint(180, 350)

            # Set OpenInference attributes
            span.set_attribute("llm.model_name", "support-copilot-v2")
            span.set_attribute("llm.token_count.prompt", input_tokens)
            span.set_attribute("llm.token_count.completion", output_tokens)
            span.set_attribute("llm.token_count.total", input_tokens + output_tokens)

            # Input/output for context
            user_msg = "How do I reset my account password?" if not is_degraded else "How do I reset my acc..."
            span.set_attribute("input.value", user_msg)

            if is_degraded:
                # Hallucinated answer
                span.set_attribute("output.value",
                    "To reset your password, please call our hotline at 1-800-FAKE-NUM and provide your social security number.")
                span.set_attribute("eval.hallucination", "hallucinated")
                span.set_attribute("eval.hallucination_score", round(random.uniform(0.7, 0.95), 2))
                span.set_attribute("eval.relevance_score", round(random.uniform(0.3, 0.55), 2))
            else:
                span.set_attribute("output.value",
                    "Go to Settings > Security > Reset Password. You'll receive a verification email within 2 minutes.")
                span.set_attribute("eval.hallucination", "factual")
                span.set_attribute("eval.hallucination_score", round(random.uniform(0.01, 0.08), 2))
                span.set_attribute("eval.relevance_score", round(random.uniform(0.88, 0.97), 2))

            # Custom attributes ARIA looks for
            span.set_attribute("aria.prompt_truncated", is_degraded)
            span.set_attribute("aria.latency_ms", latency_ms)

            # End span with appropriate duration
            span.end(end_time=int((start_time + latency_ms / 1000) * 1e9))

        traces_sent += 1

    # Force flush
    tracer_provider.force_flush()
    print(f"✅ Sent {traces_sent} traces to Phoenix")
    print(f"   • 10 healthy (high relevance, low hallucination, ~3400 tokens)")
    print(f"   • 10 degraded (hallucinated, low relevance, ~1000 tokens — truncated prompts)")
    print(f"   View them: {PHOENIX_HOST}")


if __name__ == "__main__":
    seed()
