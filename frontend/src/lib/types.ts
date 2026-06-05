// Shared types mirroring the backend's incident models.

export type SignalSource = "dynatrace" | "arize";
export type Severity = "ok" | "info" | "warning" | "critical";

export interface Signal {
  id: string;
  source: SignalSource;
  name: string;
  value: number;
  unit: string;
  severity: Severity;
  detail: string;
  entity: string;
  captured_at: number;
}

export type ReasoningKind =
  | "pull"
  | "correlate"
  | "hypothesis"
  | "root_cause"
  | "plan"
  | "execute"
  | "report"
  | "info";

export interface ReasoningStep {
  id: string;
  kind: ReasoningKind;
  icon: string;
  text: string;
  created_at: number;
}

export type ActionMode = "auto" | "needs_approval";
export type ActionStatus =
  | "proposed"
  | "approved"
  | "rejected"
  | "executing"
  | "done"
  | "failed";

export interface RemediationAction {
  id: string;
  title: string;
  description: string;
  mode: ActionMode;
  status: ActionStatus;
  tool: string;
  result: string;
  waiting?: boolean;
}

export interface RootCause {
  summary: string;
  confidence: number;
  causal_chain: string[];
  crosses_boundary: boolean;
}

export type IncidentPhase =
  | "calm"
  | "detected"
  | "reasoning"
  | "awaiting_approval"
  | "remediating"
  | "resolved";

export interface Scenario {
  key: string;
  title: string;
  blurb: string;
}

export interface Health {
  status: string;
  mode: string;
  reasoning_backend: string;
  model: string;
  integrations: {
    gemini: boolean;
    dynatrace: boolean;
    arize_phoenix: boolean;
  };
}

export type StreamEventType =
  | "phase"
  | "signal"
  | "reasoning"
  | "root_cause"
  | "action"
  | "action_update"
  | "report"
  | "done"
  | "error";

export interface StreamEvent {
  type: StreamEventType;
  incident_id: string;
  payload: Record<string, unknown>;
  ts: number;
}
