"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  approveAction,
  getBaseline,
  getHealth,
  getScenarios,
  injectIncident,
  rejectAction,
  streamIncident,
} from "./api";
import type {
  Health,
  IncidentPhase,
  ReasoningStep,
  RemediationAction,
  RootCause,
  Scenario,
  Severity,
  Signal,
  StreamEvent,
} from "./types";

export interface TimelineEntry {
  id: string;
  title: string;
  scenario: string;
  phase: IncidentPhase;
  severity: Severity;
  startedAt: number;
  rootCause: string;
}

interface StoreValue {
  // meta
  health: Health | null;
  scenarios: Scenario[];
  selected: string;
  setSelected: (k: string) => void;

  // active incident view
  activeId: string | null;
  phase: IncidentPhase;
  signals: Signal[];
  reasoning: ReasoningStep[];
  rootCause: RootCause | null;
  actions: RemediationAction[];
  report: string;
  running: boolean;
  elapsed: number;

  // history
  timeline: TimelineEntry[];

  // actions
  inject: (scenario?: string) => Promise<string | null>;
  approve: (actionId: string) => void;
  reject: (actionId: string) => void;
  reset: () => void;
}

const Ctx = createContext<StoreValue | null>(null);

function worstSeverity(signals: Signal[]): Severity {
  if (signals.some((s) => s.severity === "critical")) return "critical";
  if (signals.some((s) => s.severity === "warning")) return "warning";
  if (signals.some((s) => s.severity === "info")) return "info";
  return "ok";
}

export function IncidentProvider({ children }: { children: React.ReactNode }) {
  const [health, setHealth] = useState<Health | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selected, setSelected] = useState("memory_hallucination");

  const [activeId, setActiveId] = useState<string | null>(null);
  const [phase, setPhase] = useState<IncidentPhase>("calm");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [rootCause, setRootCause] = useState<RootCause | null>(null);
  const [actions, setActions] = useState<RemediationAction[]>([]);
  const [report, setReport] = useState("");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  const cleanupRef = useRef<(() => void) | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null));
    getScenarios()
      .then((s) => {
        setScenarios(s);
        if (s.length) setSelected((c) => c || s[0].key);
      })
      .catch(() => {});
  }, []);

  // Baseline signals when idle.
  useEffect(() => {
    if (phase === "calm") getBaseline(selected).then(setSignals).catch(() => {});
  }, [selected, phase]);

  useEffect(() => () => cleanupRef.current?.(), []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(
      () => setElapsed((Date.now() - startRef.current) / 1000),
      100,
    );
    return () => clearInterval(id);
  }, [running]);

  const patchTimeline = useCallback(
    (id: string, patch: Partial<TimelineEntry>) =>
      setTimeline((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      ),
    [],
  );

  const onEvent = useCallback(
    (id: string, e: StreamEvent) => {
      const p = e.payload as Record<string, unknown>;
      switch (e.type) {
        case "phase":
          setPhase(p.phase as IncidentPhase);
          patchTimeline(id, { phase: p.phase as IncidentPhase });
          break;
        case "signal":
          setSignals((prev) => {
            const next = [...prev, p as unknown as Signal];
            patchTimeline(id, { severity: worstSeverity(next) });
            return next;
          });
          break;
        case "reasoning":
          setReasoning((prev) => [...prev, p as unknown as ReasoningStep]);
          break;
        case "root_cause": {
          const rc = p as unknown as RootCause;
          setRootCause(rc);
          patchTimeline(id, { rootCause: rc.summary });
          break;
        }
        case "action":
          setActions((prev) => [...prev, p as unknown as RemediationAction]);
          break;
        case "action_update": {
          const u = p as unknown as RemediationAction;
          setActions((prev) =>
            prev.map((a) => (a.id === u.id ? { ...a, ...u } : a)),
          );
          break;
        }
        case "report":
          setReport(p.markdown as string);
          break;
        case "done":
        case "error":
          setRunning(false);
          break;
      }
    },
    [patchTimeline],
  );

  const inject = useCallback(
    async (scenario?: string) => {
      const key = scenario ?? selected;
      cleanupRef.current?.();
      setReasoning([]);
      setRootCause(null);
      setActions([]);
      setReport("");
      setSignals([]);
      setRunning(true);
      startRef.current = Date.now();
      setElapsed(0);
      setPhase("detected");

      const id = await injectIncident(key);
      setActiveId(id);
      const title = scenarios.find((s) => s.key === key)?.title ?? "Incident";
      setTimeline((prev) => [
        {
          id,
          title,
          scenario: key,
          phase: "detected",
          severity: "critical",
          startedAt: Date.now(),
          rootCause: "",
        },
        ...prev,
      ]);
      cleanupRef.current = streamIncident(
        id,
        (e) => onEvent(id, e),
        () => setRunning(false),
      );
      return id;
    },
    [selected, scenarios, onEvent],
  );

  const approve = useCallback((actionId: string) => {
    if (activeIdRef.current) approveAction(activeIdRef.current, actionId);
    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, status: "approved" } : a)),
    );
  }, []);

  const reject = useCallback((actionId: string) => {
    if (activeIdRef.current) rejectAction(activeIdRef.current, actionId);
    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, status: "rejected" } : a)),
    );
  }, []);

  // Keep a ref of activeId for the stable approve/reject callbacks.
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  const reset = useCallback(() => {
    cleanupRef.current?.();
    setPhase("calm");
    setReasoning([]);
    setRootCause(null);
    setActions([]);
    setReport("");
    setElapsed(0);
    setActiveId(null);
    setRunning(false);
    getBaseline(selected).then(setSignals).catch(() => {});
  }, [selected]);

  const value = useMemo<StoreValue>(
    () => ({
      health,
      scenarios,
      selected,
      setSelected,
      activeId,
      phase,
      signals,
      reasoning,
      rootCause,
      actions,
      report,
      running,
      elapsed,
      timeline,
      inject,
      approve,
      reject,
      reset,
    }),
    [
      health,
      scenarios,
      selected,
      activeId,
      phase,
      signals,
      reasoning,
      rootCause,
      actions,
      report,
      running,
      elapsed,
      timeline,
      inject,
      approve,
      reject,
      reset,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useIncident(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useIncident must be used within IncidentProvider");
  return v;
}
