"use client";

import { useEffect, useState } from "react";

import type { Health, IncidentPhase } from "@/lib/types";

export function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <span className="inline-flex items-baseline">
      <span
        className="display-title font-bold text-ink-white"
        style={{ fontSize: size, letterSpacing: "-0.03em" }}
      >
        ARIA
      </span>
      <span className="ml-0.5 h-1 w-1 animate-heartbeat rounded-full bg-amber" />
    </span>
  );
}

const STATUS: Record<IncidentPhase, { label: string; cls: string; dot: string }> = {
  calm: { label: "Nominal", cls: "text-sev-ok", dot: "bg-sev-ok" },
  detected: { label: "Incident Active", cls: "text-sev-p0 phosphor", dot: "bg-sev-p0" },
  reasoning: { label: "Reasoning", cls: "text-amber phosphor", dot: "bg-amber" },
  awaiting_approval: { label: "Awaiting Approval", cls: "text-amber phosphor", dot: "bg-amber" },
  remediating: { label: "Resolving", cls: "text-amber phosphor", dot: "bg-amber" },
  resolved: { label: "Resolved", cls: "text-sev-ok", dot: "bg-sev-ok" },
};

export function TopBar({
  phase,
  health,
}: {
  phase: IncidentPhase;
  health: Health | null;
}) {
  const [clock, setClock] = useState("--:--:--");
  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const s = STATUS[phase];

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-hair bg-void/85 px-5 backdrop-blur-sm">
      <Wordmark />

      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
        <span className={`label-caps font-mono text-[10px] ${s.cls}`}>
          {s.label}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono text-[11px] tracking-data text-ink-mid">
          {clock}
          <span className="ml-1 text-[8px] text-ink-faint">UTC</span>
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-hair font-mono text-[9px] text-ink-mid">
          OP
        </span>
      </div>
    </header>
  );
}
