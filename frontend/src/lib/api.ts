import type { Health, Scenario, Signal, StreamEvent } from "./types";

export const API =
  process.env.NEXT_PUBLIC_ARIA_API ?? "http://localhost:8000";

export async function getHealth(): Promise<Health> {
  const res = await fetch(`${API}/api/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("health check failed");
  return res.json();
}

export async function getScenarios(): Promise<Scenario[]> {
  const res = await fetch(`${API}/api/scenarios`, { cache: "no-store" });
  const data = await res.json();
  return data.scenarios;
}

export async function getBaseline(scenario: string): Promise<Signal[]> {
  const res = await fetch(`${API}/api/baseline?scenario=${scenario}`, {
    cache: "no-store",
  });
  const data = await res.json();
  return data.signals;
}

export async function injectIncident(scenario: string): Promise<string> {
  const res = await fetch(`${API}/api/incidents/inject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) throw new Error("inject failed");
  const data = await res.json();
  return data.incident_id;
}

export async function approveAction(
  incidentId: string,
  actionId: string,
): Promise<void> {
  await fetch(
    `${API}/api/incidents/${incidentId}/actions/${actionId}/approve`,
    { method: "POST" },
  );
}

export async function rejectAction(
  incidentId: string,
  actionId: string,
): Promise<void> {
  await fetch(
    `${API}/api/incidents/${incidentId}/actions/${actionId}/reject`,
    { method: "POST" },
  );
}

/**
 * Open an SSE connection to ARIA's reasoning stream.
 * Returns a cleanup function that closes the connection.
 *
 * We use EventSource against the named-event API the backend emits
 * (event: phase|signal|reasoning|...). Each handler decodes the JSON
 * envelope and forwards it to `onEvent`.
 */
export function streamIncident(
  incidentId: string,
  onEvent: (e: StreamEvent) => void,
  onError?: () => void,
): () => void {
  const es = new EventSource(
    `${API}/api/incidents/${incidentId}/stream`,
  );

  const types = [
    "phase",
    "signal",
    "reasoning",
    "root_cause",
    "action",
    "action_update",
    "report",
    "done",
    "error",
  ];

  for (const t of types) {
    es.addEventListener(t, (ev: MessageEvent) => {
      try {
        const parsed = JSON.parse(ev.data) as StreamEvent;
        onEvent(parsed);
        if (t === "done" || t === "error") es.close();
      } catch {
        /* ignore malformed frames */
      }
    });
  }

  es.onerror = () => {
    onError?.();
    es.close();
  };

  return () => es.close();
}
