"use client";

import { SEVERITY } from "@/lib/severity";
import type { Signal } from "@/lib/types";
import { CountUp } from "./CountUp";

/**
 * One of the two "oracles" — a source-of-truth health panel. Shows a large
 * health score in the display serif and the live signals beneath it.
 */
export function OraclePanel({
  source,
  signals,
  connected,
}: {
  source: "dynatrace" | "arize";
  signals: Signal[];
  connected: boolean;
}) {
  const isDyna = source === "dynatrace";
  const name = isDyna ? "Dynatrace" : "Arize Phoenix";
  const kind = isDyna ? "Infrastructure" : "AI Quality";
  const accent = isDyna ? "text-ice" : "text-amber";
  const scoreColor = isDyna ? "#aac6d6" : "#d6a052";

  // Health score: 100 minus a penalty for each non-OK signal.
  const penalty = signals.reduce((acc, s) => {
    if (s.severity === "critical") return acc + 26;
    if (s.severity === "warning") return acc + 12;
    return acc;
  }, 0);
  const score = Math.max(2, 100 - penalty);

  return (
    <div
      className={`relative border ${isDyna ? "border-ice/15" : "border-amber/15"} bg-canvas/70`}
    >
      <header className="flex items-center justify-between border-b border-hair/70 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connected ? (isDyna ? "bg-ice" : "bg-amber") : "bg-ink-faint"
            } ${connected ? "" : ""}`}
          />
          <span className="label-caps font-mono text-[9.5px] text-ink-mid">
            {name}
          </span>
          <span className="label-caps font-mono text-[8px] text-ink-faint">
            {connected ? "MCP" : "demo"}
          </span>
        </div>
        <span className={`label-caps font-mono text-[8.5px] ${accent}`}>
          {kind}
        </span>
      </header>

      <div className="flex items-end gap-3 px-4 pb-3 pt-4">
        <span
          className="display-title font-medium leading-none tracking-title"
          style={{ fontSize: 60, color: scoreColor }}
        >
          <CountUp value={score} duration={700} />
        </span>
        <span className="mb-2 label-caps font-mono text-[8.5px] text-ink-lo">
          health
        </span>
      </div>

      <div className="border-t border-hair/60">
        {signals.length === 0 ? (
          <div className="px-4 py-6 text-center font-mono text-[10.5px] text-ink-lo">
            all nominal
          </div>
        ) : (
          signals.map((s) => <OracleRow key={s.id} signal={s} />)
        )}
      </div>
    </div>
  );
}

function OracleRow({ signal }: { signal: Signal }) {
  const sev = SEVERITY[signal.severity];
  const isCrit = signal.severity === "critical";
  const decimals = Number.isInteger(signal.value) ? 0 : signal.value < 10 ? 2 : 0;
  return (
    <div className="group flex items-center justify-between gap-3 border-b border-hair/40 px-4 py-2 transition-colors last:border-b-0 hover:bg-amber/[0.04]">
      <div className="flex min-w-0 items-center gap-2">
        <span className={`text-[7px] ${sev.text} ${isCrit ? "animate-sev-pulse" : ""}`}>
          {sev.glyph}
        </span>
        <span className="truncate text-[12px] text-ink-mid group-hover:text-ink-hi">
          {signal.name}
        </span>
      </div>
      <span className="shrink-0 font-mono text-[12.5px] tracking-data text-ink-hi">
        <CountUp value={signal.value} decimals={decimals} />
        <span className="ml-0.5 text-[9px] text-ink-lo">{signal.unit}</span>
      </span>
    </div>
  );
}
