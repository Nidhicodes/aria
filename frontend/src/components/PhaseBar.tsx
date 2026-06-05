import type { IncidentPhase } from "@/lib/types";

const PHASES: { key: IncidentPhase; label: string }[] = [
  { key: "calm", label: "Nominal" },
  { key: "detected", label: "Detected" },
  { key: "reasoning", label: "Reasoning" },
  { key: "awaiting_approval", label: "Approval" },
  { key: "remediating", label: "Remediating" },
  { key: "resolved", label: "Resolved" },
];

const order: Record<string, number> = Object.fromEntries(
  PHASES.map((p, i) => [p.key, i]),
);

export function PhaseBar({ phase }: { phase: IncidentPhase }) {
  const current = order[phase] ?? 0;
  return (
    <div className="flex items-center">
      {PHASES.map((p, i) => {
        const active = i <= current;
        const isNow = i === current;
        const live = isNow && phase !== "resolved" && phase !== "calm";
        return (
          <div key={p.key} className="flex items-center">
            <span
              className={`label-caps font-mono text-[9px] transition-colors ${
                live
                  ? "text-amber phosphor"
                  : isNow
                    ? "text-ink-hi"
                    : active
                      ? "text-sev-ok/70"
                      : "text-ink-faint"
              }`}
            >
              {p.label}
            </span>
            {i < PHASES.length - 1 && (
              <span
                className={`mx-2 h-px w-4 transition-colors ${
                  active ? "bg-sev-ok/40" : "bg-hair"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
