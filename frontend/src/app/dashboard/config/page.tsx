"use client";

import { useState } from "react";

import { InstrumentSlider } from "@/components/InstrumentSlider";
import { useIncident } from "@/lib/store";

type ConnStatus = "connected" | "degraded" | "disconnected";

function StatusDot({ status }: { status: ConnStatus }) {
  const map = {
    connected: { cls: "bg-sev-ok", pulse: true, label: "connected" },
    degraded: { cls: "bg-amber", pulse: false, label: "degraded" },
    disconnected: { cls: "bg-sev-p0", pulse: false, label: "disconnected" },
  }[status];
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${map.cls} ${map.pulse ? "animate-heartbeat" : ""}`} />
      <span className="label-caps font-mono text-[8.5px] text-ink-lo">{map.label}</span>
    </span>
  );
}

function SourceCard({
  name,
  detail,
  status,
  tint,
  tools,
}: {
  name: string;
  detail: string;
  status: ConnStatus;
  tint: string;
  tools: string[];
}) {
  return (
    <div className="border border-hair bg-canvas/70 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[14px] text-ink-hi" style={{ color: tint }}>
          {name}
        </span>
        <StatusDot status={status} />
      </div>
      <p className="mt-1 font-mono text-[10.5px] text-ink-lo">{detail}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tools.map((t) => (
          <span
            key={t}
            className="border border-hair px-1.5 py-0.5 font-mono text-[9px] text-ink-mid"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

const SECTIONS = ["Sources", "Thresholds", "Autonomy"] as const;

export default function Configuration() {
  const { health } = useIncident();
  const [section, setSection] = useState<(typeof SECTIONS)[number]>("Sources");

  const dynaStatus: ConnStatus = health?.integrations.dynatrace
    ? "connected"
    : "degraded";
  const arizeStatus: ConnStatus = health?.integrations.arize_phoenix
    ? "connected"
    : "degraded";

  return (
    <div className="mx-auto flex max-w-[1000px] gap-8 px-6 py-6">
      {/* Settings sidebar */}
      <aside className="w-[160px] shrink-0">
        <h1 className="display-title mb-4 text-[20px] text-ink-white">
          Configuration
        </h1>
        <nav className="space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`block w-full border-l-2 px-3 py-1.5 text-left text-[12.5px] transition-colors ${
                section === s
                  ? "border-amber text-amber"
                  : "border-transparent text-ink-mid hover:text-ink-hi"
              }`}
            >
              {s}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {section === "Sources" && (
          <div className="space-y-3">
            <p className="mb-2 font-mono text-[11px] text-ink-lo">
              Partner MCP servers ARIA reasons across.
            </p>
            <SourceCard
              name="Dynatrace"
              detail={health?.integrations.dynatrace ? "live via MCP" : "demo mode — synthetic signals"}
              status={dynaStatus}
              tint="#aac6d6"
              tools={["list_problems", "execute_dql", "get_kubernetes_events", "send_event"]}
            />
            <SourceCard
              name="Arize Phoenix"
              detail={health?.integrations.arize_phoenix ? "live via MCP" : "demo mode — synthetic signals"}
              status={arizeStatus}
              tint="#d6a052"
              tools={["list-traces", "get-spans", "get-span-annotations", "list-experiments"]}
            />
            <SourceCard
              name="Gemini"
              detail={health?.integrations.gemini ? `live · ${health.model}` : "scripted fallback"}
              status={health?.integrations.gemini ? "connected" : "degraded"}
              tint="#ece7df"
              tools={["planner", "reasoner", "executor"]}
            />
          </div>
        )}

        {section === "Thresholds" && (
          <div className="max-w-[460px]">
            <p className="mb-2 font-mono text-[11px] text-ink-lo">
              Calibrate when ARIA wakes up. Like dialing in an instrument.
            </p>
            <div className="divide-y divide-hair/60 border border-hair bg-canvas/60 px-4">
              <InstrumentSlider label="Memory utilization" min={50} max={100} step={1} unit="%" defaultValue={90} />
              <InstrumentSlider label="Hallucination rate" min={1} max={20} step={0.5} unit="%" defaultValue={5} />
              <InstrumentSlider label="Model latency p95" min={1} max={20} step={0.5} unit="s" defaultValue={8} />
              <InstrumentSlider label="Eval-score floor" min={0.5} max={1} step={0.01} unit="" defaultValue={0.8} />
              <InstrumentSlider label="Correlation window" min={5} max={60} step={5} unit="m" defaultValue={30} />
            </div>
          </div>
        )}

        {section === "Autonomy" && <AutonomySection />}
      </div>
    </div>
  );
}

const AUTONOMY_DEFAULTS = [
  { t: "Horizontal scaling", auto: true },
  { t: "Evict noisy-neighbor jobs", auto: true },
  { t: "Draft & send reports", auto: true },
  { t: "Prompt-template changes", auto: false },
  { t: "Rollbacks", auto: false },
  { t: "Config pushes", auto: false },
];

function AutonomySection() {
  const [rows, setRows] = useState(AUTONOMY_DEFAULTS);
  const toggle = (i: number) =>
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, auto: !r.auto } : r)));

  return (
    <div className="max-w-[460px] space-y-3">
      <p className="mb-2 font-mono text-[11px] text-ink-lo">
        What ARIA may do without asking. Toggle to move a capability between
        automatic and human-approved.
      </p>
      {rows.map((r, i) => (
        <button
          key={r.t}
          onClick={() => toggle(i)}
          className="flex w-full items-center justify-between border border-hair bg-canvas/60 px-4 py-2.5 text-left transition-colors hover:border-amber/40"
        >
          <span className="text-[12.5px] text-ink-mid">{r.t}</span>
          <span className="flex items-center gap-2">
            <span
              className={`label-caps font-mono text-[8.5px] ${r.auto ? "text-ice/70" : "text-amber"}`}
            >
              {r.auto ? "auto" : "review required"}
            </span>
            <span
              className={`relative h-4 w-7 rounded-full border transition-colors ${
                r.auto ? "border-ice/40 bg-ice/15" : "border-amber/40 bg-amber/10"
              }`}
            >
              <span
                className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition-all ${
                  r.auto ? "left-[14px] bg-ice" : "left-[2px] bg-amber"
                }`}
              />
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
