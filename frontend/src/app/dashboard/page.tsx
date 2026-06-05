"use client";

import { useRouter } from "next/navigation";

import { IncidentTimeline } from "@/components/IncidentTimeline";
import { OraclePanel } from "@/components/OraclePanel";
import { useIncident } from "@/lib/store";

export default function Overview() {
  const router = useRouter();
  const {
    health,
    signals,
    scenarios,
    selected,
    setSelected,
    running,
    timeline,
    inject,
  } = useIncident();

  const dyna = signals.filter((s) => s.source === "dynatrace");
  const arize = signals.filter((s) => s.source === "arize");

  const launch = async () => {
    await inject();
    router.push("/dashboard/incident");
  };

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-title text-[28px] text-ink-white">
            Command Overview
          </h1>
          <p className="mt-1 font-mono text-[11px] text-ink-lo">
            Two sources of truth, watched as one.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selected}
            disabled={running}
            onChange={(e) => setSelected(e.target.value)}
            className="border border-hair bg-surface px-3 py-1.5 font-mono text-[11px] text-ink-mid outline-none focus:border-amber disabled:opacity-50"
          >
            {scenarios.map((s) => (
              <option key={s.key} value={s.key}>
                {s.title}
              </option>
            ))}
          </select>
          <button
            onClick={launch}
            disabled={running}
            className="btn-rise border border-amber px-5 py-1.5 font-mono text-[11px] font-medium text-amber transition-colors hover:text-void disabled:cursor-not-allowed disabled:opacity-40"
          >
            {running ? "incident live" : "⚡ inject incident"}
          </button>
        </div>
      </div>

      {/* Dual oracles */}
      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2">
        <OraclePanel
          source="dynatrace"
          signals={dyna}
          connected={!!health?.integrations.dynatrace}
        />
        <OraclePanel
          source="arize"
          signals={arize}
          connected={!!health?.integrations.arize_phoenix}
        />
        {/* The bridge between them */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
          <span className="block h-10 w-px bg-gradient-to-b from-ice/40 to-amber/40" />
        </div>
      </div>

      {/* Incident timeline */}
      <div className="mt-8">
        <h2 className="label-caps mb-3 font-mono text-[10px] text-ink-lo">
          Incident timeline
        </h2>
        <IncidentTimeline entries={timeline} />
      </div>
    </div>
  );
}
