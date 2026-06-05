# Deploying ARIA

ARIA is two services — a FastAPI backend and a Next.js frontend — both
containerized and ready for **Google Cloud Run**.

## Local (fastest)

```bash
cd aria
docker compose up --build
# open http://localhost:3000
```

Or run the two services directly (see the top-level README quickstart).

## Google Cloud Run

Set your project and region once:

```bash
export PROJECT=your-gcp-project
export REGION=us-central1
gcloud config set project $PROJECT
```

### 1. Backend

```bash
cd aria/backend
gcloud run deploy aria-backend \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars ARIA_MODE=demo
# For live mode add your secrets:
#   --set-env-vars ARIA_MODE=live,GOOGLE_API_KEY=...,DT_ENVIRONMENT=...,DT_PLATFORM_TOKEN=...,PHOENIX_API_KEY=...
```

Copy the service URL it prints (e.g. `https://aria-backend-xxxx.run.app`).

### 2. Frontend

```bash
cd aria/frontend
gcloud run deploy aria-frontend \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_ARIA_API=https://aria-backend-xxxx.run.app
```

Open the frontend URL — that's your hosted project link for the submission.

> Note: set the backend's `ARIA_CORS_ORIGINS` to the deployed frontend URL for
> production (defaults to `http://localhost:3000`).

## Using real Gemini

Set `GOOGLE_API_KEY` (Gemini API) **or** `GOOGLE_GENAI_USE_VERTEXAI=true` with
`GOOGLE_CLOUD_PROJECT`. ARIA will reason with the model named by `ARIA_MODEL`
(`gemini-3-pro-preview` by default). With no key, ARIA uses its scripted
fallback so the demo still runs.
