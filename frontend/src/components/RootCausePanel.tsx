"use client";

import { useEffect, useState } from "react";

import type { RootCause } from "@/lib/types";
import { CountUp } from "./CountUp";

function confidenceColor(pct: number) {
  if (pct >= 80) return "#6f967c";
  if (pct >= 50) return "#c79a5a";
  return "#9e3b40";
}

export function RootCausePanel({ rc }: { rc: RootCause }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!rc.summary) return null;
  const pct = Math.round(rc.confidence * 100);
  const color = confidenceColor(pct);

  return (
    <div className="animate-fade-up border-t border-amber/30 pt-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="rule-draw h-px w-6 origin-left animate-draw-x bg-amber/50" />
        <span className="label-caps font-mono text-[9.5px] text-amber/80">
          Conclusion
        </span>
      </div>

      <div className="flex items-start gap-4">
        {/* Confidence — counts up, color climbs with it */}
        <div className="shrink-0 text-center">
          <div
            className="font-mono text-[34px] font-medium leading-none tracking-data transition-colors duration-700"
            style={{ color: revealed ? color : "#6a655d" }}
          >
            <CountUp value={revealed ? pct : 0} duration={800} />
            <span className="text-[16px]">%</span>
          </div>
          <div className="mt-1 label-caps font-mono text-[8px] text-ink-lo">
            confidence
          </div>
        </div>

        <div className="min-w-0">
          {rc.crosses_boundary && (
            <span className="mb-1.5 inline-flex items-center gap-1.5 border border-hair px-2 py-0.5">
              <span className="text-[9px] text-ice">infra</span>
              <span className="text-amber">↔</span>
              <span className="text-[9px] text-amber">model</span>
              <span className="label-caps ml-1 font-mono text-[8px] text-ink-mid">
                boundary crossed
              </span>
            </span>
          )}
          <p className="text-[14px] leading-snug text-ink-hi">{rc.summary}</p>
        </div>
      </div>

      {rc.causal_chain.length > 0 && (
        <ol className="mt-4 space-y-0">
          {rc.causal_chain.map((link, i) => (
            <li key={i} className="flex items-stretch gap-3">
              <div className="flex flex-col items-center">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center font-mono text-[10px] text-amber/80">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {i < rc.causal_chain.length - 1 && (
                  <span className="my-0.5 w-px flex-1 bg-gradient-to-b from-amber/40 to-hair" />
                )}
              </div>
              <p className="pb-3 pt-0.5 font-mono text-[11.5px] leading-snug tracking-data text-ink-mid">
                {link}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
