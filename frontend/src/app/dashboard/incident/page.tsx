"use client";

import Link from "next/link";

import { ActionCard, ApproveAllButton } from "@/components/ActionCard";
import { CountUp } from "@/components/CountUp";
import { EvidenceColumn } from "@/components/EvidenceColumn";
import { ReasoningChain } from "@/components/ReasoningChain";
import { ReportPanel } from "@/components/ReportPanel";
import { RootCausePanel } from "@/components/RootCausePanel";
import { SEVERITY } from "@/lib/severity";
import { useIncident } from "@/lib/store";

export default function ActiveIncident() {
  const {
    activeId,
    phase,
    signals,
    reasoning,
    rootCause,
    actions,
    report,
    running,
    elapsed,
    approve,
    reject,
    timeline,
  } = useIncident();

  if (!activeId) {
    return (
      <div className="mx-auto flex max-w-[700px] flex-col items-center px-6 py-24 text-center">
        <h1 className="display-title text-[26px] text-ink-hi">No active incident</h1>
        <p className="mt-2 font-mono text-[12px] text-ink-lo">
          ARIA is watching. Inject an incident from the overview to see it respond.
        </p>
        <Link
          href="/dashboard"
          className="btn-rise mt-6 border border-amber px-5 py-2 font-mono text-[11px] text-amber transition-colors hover:text-void"
        >
          ← back to overview
        </Link>
      </div>
    );
  }

  const current = timeline.find((t) => t.id === activeId);
  const sev = SEVERITY[current?.severity ?? "critical"];
  const pendingApprovals = actions.filter(
    (a) => a.mode === "needs_approval" && (a.status === "proposed" || a.waiting),
  );
  const resolved = phase === "resolved";

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      {/* Header */}
      <div className="mb-6 border-b border-hair pb-5">
        <div className="flex items-center gap-3">
          <span className={`h-2 w-2 rounded-full ${sev.dot} ${!resolved ? "animate-sev-pulse" : ""}`} />
          <span className={`label-caps font-mono text-[9px] ${sev.text}`}>
            {sev.label}
          </span>
          <span className="label-caps font-mono text-[9px] text-ink-lo">
            infra ↔ model
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="display-title text-[clamp(24px,4vw,36px)] text-ink-white">
            {current?.title ?? "Incident"}
          </h1>
          <div className="text-right">
            <div
              className={`font-mono text-[28px] tracking-data ${resolved ? "text-sev-ok" : "text-amber phosphor"}`}
            >
              <CountUp value={elapsed} decimals={1} duration={120} suffix="s" />
            </div>
            <div className="label-caps font-mono text-[8px] text-ink-lo">
              {resolved ? "time to resolve" : "elapsed"}
            </div>
          </div>
        </div>
      </div>

      {resolved && report ? (
        // Report screen — document gets full breathing room.
        <div className="mx-auto max-w-[760px]">
          <ReportPanel markdown={report} title={current?.title ?? "incident"} />
          <div className="mt-6 flex justify-center">
            <Link
              href="/dashboard"
              className="font-mono text-[11px] text-ink-mid transition-colors hover:text-amber"
            >
              ← back to overview
            </Link>
          </div>
        </div>
      ) : (
        // Three-column active layout: 28 / 44 / 28
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[28fr_44fr_28fr]">
          {/* Evidence */}
          <EvidenceColumn signals={signals} />

          {/* Reasoning — dominant, the only lifted surface */}
          <div className="border border-amber/15 bg-surface/60">
            <header className="flex items-center justify-between border-b border-hair px-4 py-2.5">
              <span className="label-caps font-mono text-[9.5px] text-amber/80">
                ARIA is reasoning
              </span>
            </header>
            <div className="px-4 py-4">
              <ReasoningChain steps={reasoning} thinking={running} />
              {rootCause && (
                <div className="mt-3">
                  <RootCausePanel rc={rootCause} />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <div className="label-caps mb-1 font-mono text-[9px] text-ink-lo">
              remediation
            </div>
            {actions.length === 0 ? (
              <p className="border border-hair bg-canvas/60 py-6 text-center font-mono text-[10.5px] text-ink-lo">
                awaiting plan…
              </p>
            ) : (
              actions.map((a, i) => (
                <ActionCard
                  key={a.id}
                  action={a}
                  index={i + 1}
                  onApprove={approve}
                  onReject={reject}
                />
              ))
            )}
            {pendingApprovals.length > 0 && (
              <ApproveAllButton
                count={pendingApprovals.length}
                onConfirm={() => pendingApprovals.forEach((a) => approve(a.id))}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
