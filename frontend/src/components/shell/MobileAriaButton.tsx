"use client";

import { useState } from "react";

import { ReasoningChain } from "@/components/ReasoningChain";
import { RootCausePanel } from "@/components/RootCausePanel";
import { useIncident } from "@/lib/store";

/**
 * Mobile/tablet access to ARIA's reasoning — a floating amber button showing
 * the current status dot. Tapping opens a full-screen reasoning overlay.
 * Hidden on lg+ where the dedicated right panel is always visible.
 */
export function MobileAriaButton() {
  const { reasoning, running, rootCause } = useIncident();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open ARIA reasoning"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-amber bg-void/90 backdrop-blur lg:hidden"
      >
        <span className="display-title text-[18px] font-bold text-amber">A</span>
        <span
          className={`absolute right-1 top-1 h-2.5 w-2.5 rounded-full ${
            running ? "animate-heartbeat bg-amber" : "bg-sev-ok"
          }`}
        />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-void/95 backdrop-blur lg:hidden">
          <header className="flex items-center justify-between border-b border-hair px-5 py-4">
            <span className="label-caps font-mono text-[10px] text-ink-mid">
              ARIA Reasoning
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="font-mono text-[12px] text-ink-mid hover:text-amber"
            >
              close ✕
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <ReasoningChain steps={reasoning} thinking={running} />
            {rootCause && (
              <div className="mt-3">
                <RootCausePanel rc={rootCause} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
