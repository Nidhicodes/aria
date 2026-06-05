# ARIA backend — FastAPI + ADK, deployable to Google Cloud Run.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Node is needed so live mode can spawn the partner MCP servers via npx.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml ./
COPY aria ./aria
# Install with ADK extra so live mode works in the deployed container.
RUN pip install ".[adk]"

ENV ARIA_HOST=0.0.0.0
# Cloud Run injects PORT; default to 8000 locally.
ENV ARIA_PORT=8080
EXPOSE 8080

# Respect Cloud Run's $PORT if provided.
CMD ["sh", "-c", "uvicorn aria.server:app --host 0.0.0.0 --port ${PORT:-8080}"]
