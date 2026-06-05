"use client";

import { useState } from "react";

import type { RemediationAction } from "@/lib/types";

const STATUS: Record<string, { label: string; cls: string }> = {
  proposed: { label: "PENDING", cls: "text-ink-lo" },
  approved: { label: "APPROVED", cls: "text-sev-ok" },
  rejected: { label: "REJECTED", cls: "text-sev-p0" },
  executing: { label: "EXECUTING", cls: "text-amber animate-sev-pulse" },
  done: { label: "DONE", cls: "text-sev-ok" },
  failed: { label: "FAILED", cls: "text-sev-p0" },
};

export function ActionCard({
  action,
  index,
  onApprove,
  onReject,
}: {
  action: RemediationAction;
  index: number;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const status = STATUS[action.status] ?? STATUS.proposed;
  const isAuto = action.mode === "auto";
  const needsDecision =
    action.mode === "needs_approval" &&
    (action.status === "proposed" || action.waiting);

  return (
    <div className="relative animate-fade-up overflow-hidden border border-hair/70 bg-surface/60 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-hair hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]">
      {/* Watermark number */}
      <span className="display-title pointer-events-none absolute -right-1 -top-3 select-none text-[64px] font-black leading-none text-ink-white/[0.03]">
        {index}
      </span>

      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`label-caps font-mono text-[8.5px] ${
              isAuto ? "text-ice/70" : "text-amber"
            }`}
          >
            {isAuto ? "Auto" : "Review required"}
          </span>
          <span className={`label-caps font-mono text-[8.5px] ${status.cls}`}>
            {status.label}
          </span>
        </div>

        <h4 className="mt-1.5 text-[13.5px] leading-snug text-ink-hi">
          {action.title}
        </h4>
        {action.description && (
          <p className="mt-1 text-[11.5px] leading-snug text-ink-mid">
            {action.description}
          </p>
        )}
        {action.tool && (
          <p className="mt-1 font-mono text-[9.5px] text-ink-lo">↳ {action.tool}</p>
        )}

        {action.result && (
          <p className="mt-2 border-l border-sev-ok/40 pl-2 font-mono text-[10.5px] leading-snug text-sev-ok">
            {action.result}
          </p>
        )}

        {needsDecision && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onApprove(action.id)}
              className="btn-rise flex-1 border border-amber px-3 py-1.5 text-[11px] font-medium text-amber transition-colors hover:text-void"
            >
              Approve
            </button>
            <button
              onClick={() => onReject(action.id)}
              className="border border-hair px-3 py-1.5 text-[11px] text-ink-mid transition-colors hover:border-sev-p0/50 hover:text-sev-p0"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ApproveAllButton({
  count,
  onConfirm,
}: {
  count: number;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);
  if (count <= 0) return null;
  return (
    <button
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      onMouseLeave={() => setArmed(false)}
      className="btn-rise w-full border border-amber px-3 py-2 text-[11.5px] font-medium text-amber transition-colors hover:text-void"
    >
      {armed ? `Confirm — execute ${count} action${count > 1 ? "s" : ""}` : "Approve all auto actions"}
    </button>
  );
}
