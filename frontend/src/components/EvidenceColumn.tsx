"use client";

import { useState } from "react";

import { SEVERITY } from "@/lib/severity";
import { Sparkline } from "@/components/Sparkline";
import type { Signal } from "@/lib/types";

// Build a plausible anomaly-shaped series ending at the signal's value.
function series(value: number, severity: string): number[] {
  const base = value * (severity === "critical" ? 0.4 : severity === "warning" ? 0.6 : 0.95);
  const pts: number[] = [];
  for (let i = 0; i < 11; i++) {
    const t = i / 10;
    const ramp = severity === "ok" ? base : base + (value - base) * Math.pow(t, 2.2);
    pts.push(ramp + (Math.random() - 0.5) * value * 0.03);
  }
  pts[pts.length - 1] = value;
  return pts;
}

export function EvidenceColumn({ signals }: { signals: Signal[] }) {
  const [tab, setTab] = useState<"infra" | "llm">("infra");
  const infra = signals.filter((s) => s.source === "dynatrace");
  const llm = signals.filter((s) => s.source === "arize");
  const shown = tab === "infra" ? infra : llm;

  // The triggering metric = the worst-severity signal in the active tab.
  const trigger =
    shown.find((s) => s.severity === "critical") ?? shown[0];

  return (
    <div className="border border-hair bg-canvas/70">
      <div className="flex border-b border-hair">
        {(["infra", "llm"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative flex-1 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors ${
              tab === t ? "text-amber" : "text-ink-lo hover:text-ink-mid"
            }`}
          >
            {t === "infra" ? "Dynatrace" : "Arize"}
            {tab === t && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full bg-amber" />
            )}
          </button>
        ))}
      </div>

      <div className="p-4">
        {trigger ? (
          <>
            <div className="label-caps font-mono text-[8.5px] text-ink-lo">
              triggering metric
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-[30px] tracking-data text-ink-white">
                {trigger.value}
                <span className="text-[13px] text-ink-lo">{trigger.unit}</span>
              </span>
              <span className="text-[12px] text-ink-mid">{trigger.name}</span>
            </div>
            <div className="mt-3">
              <Sparkline
                points={series(trigger.value, trigger.severity)}
                color={tab === "infra" ? "#aac6d6" : "#d6a052"}
                anomaly
                width={260}
                height={44}
              />
            </div>
          </>
        ) : (
          <p className="font-mono text-[10.5px] text-ink-lo">no signals yet</p>
        )}

        <div className="mt-5">
          <div className="label-caps mb-2 font-mono text-[8.5px] text-ink-lo">
            correlated signals
          </div>
          <div className="space-y-0">
            {shown.map((s) => {
              const sev = SEVERITY[s.severity];
              return (
                <div
                  key={s.id}
                  className="group flex items-center justify-between gap-3 border-b border-hair/40 py-1.5 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`text-[7px] ${sev.text}`}>{sev.glyph}</span>
                    <span className="truncate text-[12px] text-ink-mid">{s.name}</span>
                  </div>
                  <span className="shrink-0 font-mono text-[12px] tracking-data text-ink-hi">
                    {s.value}
                    <span className="text-[9px] text-ink-lo">{s.unit}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
