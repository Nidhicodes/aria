"use client";

import Link from "next/link";
import { useState } from "react";

import { SEVERITY } from "@/lib/severity";
import type { TimelineEntry } from "@/lib/store";

function relTime(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

const STATUS_BADGE: Record<string, { label: string; cls: string; pulse?: boolean }> = {
  detected: { label: "ACTIVE", cls: "text-sev-p0", pulse: true },
  reasoning: { label: "ACTIVE", cls: "text-amber", pulse: true },
  awaiting_approval: { label: "RESOLVING", cls: "text-amber", pulse: true },
  remediating: { label: "RESOLVING", cls: "text-amber", pulse: true },
  resolved: { label: "RESOLVED", cls: "text-sev-ok" },
  calm: { label: "—", cls: "text-ink-lo" },
};

export function IncidentTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="border border-hair bg-canvas/60 px-5 py-10 text-center">
        <p className="font-mono text-[11px] text-ink-lo">
          no incidents recorded — inject one to see ARIA respond
        </p>
      </div>
    );
  }
  return (
    <div className="divide-y divide-hair/60 border border-hair bg-canvas/60">
      {entries.map((e) => (
        <Row key={e.id} entry={e} />
      ))}
    </div>
  );
}

function Row({ entry }: { entry: TimelineEntry }) {
  const [open, setOpen] = useState(false);
  const sev = SEVERITY[entry.severity];
  const status = STATUS_BADGE[entry.phase] ?? STATUS_BADGE.calm;
  const active = entry.phase !== "resolved";

  return (
    <div className="group transition-colors hover:bg-amber/[0.03]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-4 py-3 text-left"
      >
        <span className={`h-8 w-[3px] shrink-0 ${sev.bar} ${active ? "animate-sev-pulse" : ""}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] text-ink-hi">{entry.title}</span>
            <SourceBadge scenario={entry.scenario} />
          </div>
          {entry.rootCause && (
            <p className="mt-0.5 truncate text-[11.5px] text-ink-mid">
              {entry.rootCause}
            </p>
          )}
        </div>
        <span
          className="shrink-0 font-mono text-[10px] text-ink-lo"
          title={new Date(entry.startedAt).toISOString()}
        >
          {relTime(entry.startedAt)}
        </span>
        <span
          className={`label-caps shrink-0 font-mono text-[9px] ${status.cls} ${status.pulse ? "animate-sev-pulse" : ""}`}
        >
          {status.label}
        </span>
      </button>
      {open && (
        <div className="border-t border-hair/50 bg-void/40 px-4 py-3 pl-[2.1rem]">
          <p className="text-[12px] leading-snug text-ink-mid">
            {entry.rootCause || "ARIA is still reasoning about this incident."}
          </p>
          <Link
            href="/dashboard/incident"
            className="mt-2 inline-block font-mono text-[10px] text-amber hover:underline"
          >
            view full incident →
          </Link>
        </div>
      )}
    </div>
  );
}

function SourceBadge({ scenario }: { scenario: string }) {
  // All hero scenarios are cross-layer → BOTH.
  return (
    <span className="label-caps shrink-0 border border-hair px-1.5 py-0.5 font-mono text-[8px] text-ink-mid">
      both
    </span>
  );
}
