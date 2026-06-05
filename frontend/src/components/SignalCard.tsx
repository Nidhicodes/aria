import { SEVERITY } from "@/lib/severity";
import type { Signal } from "@/lib/types";
import { CountUp } from "./CountUp";

export function SignalCard({ signal }: { signal: Signal }) {
  const sev = SEVERITY[signal.severity];
  const isCrit = signal.severity === "critical";
  const decimals = Number.isInteger(signal.value) ? 0 : signal.value < 10 ? 2 : 0;

  return (
    <div className="group relative animate-fade-up border-b border-hair/60 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-amber/[0.04]">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`shrink-0 text-[8px] ${sev.text} ${isCrit ? "animate-sev-pulse" : ""}`}>
            {sev.glyph}
          </span>
          <span className="truncate text-[13px] text-ink-hi">{signal.name}</span>
        </div>
        <span className="shrink-0 font-mono text-[15px] tracking-data text-ink-white">
          <CountUp value={signal.value} decimals={decimals} />
          <span className="ml-0.5 text-[10px] text-ink-lo">{signal.unit}</span>
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 pl-4">
        <span className="truncate text-[11px] leading-snug text-ink-mid">
          {signal.detail}
        </span>
        {signal.entity && (
          <span className="shrink-0 font-mono text-[9.5px] text-ink-lo">
            {signal.entity}
          </span>
        )}
      </div>
    </div>
  );
}
