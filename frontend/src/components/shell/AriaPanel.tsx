"use client";

import { useState } from "react";

import { ReasoningChain } from "@/components/ReasoningChain";
import { useIncident } from "@/lib/store";

/**
 * ARIA's dedicated presence — always visible on the right. Full reasoning
 * stream when active; dimmed memory when idle. Collapses to a 40px strip
 * showing only the latest line. Includes a pause control for the typewriter
 * animation (accessibility).
 */
export function AriaPanel() {
  const { reasoning, running } = useIncident();
  const [collapsed, setCollapsed] = useState(false);
  const [paused, setPaused] = useState(false);

  const latest = reasoning[reasoning.length - 1];

  if (collapsed) {
    return (
      <aside className="sticky top-12 hidden h-[calc(100vh-3rem)] w-10 shrink-0 flex-col items-center border-l border-hair bg-void/60 py-3 lg:flex">
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand ARIA panel"
          className="text-ink-mid transition-colors hover:text-amber"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 3 L5 8 L10 13" />
          </svg>
        </button>
        <div className="mt-4 flex-1 [writing-mode:vertical-rl]">
          <span className="label-caps font-mono text-[9px] text-ink-lo">
            {latest ? latest.text.slice(0, 48) : "aria reasoning"}
          </span>
        </div>
        <span
          className={`h-1.5 w-1.5 rounded-full ${running ? "animate-heartbeat bg-amber" : "bg-ink-faint"}`}
        />
      </aside>
    );
  }

  return (
    <aside className="sticky top-12 hidden h-[calc(100vh-3rem)] w-[300px] shrink-0 flex-col border-l border-hair bg-void/40 lg:flex">
      <header className="flex items-center justify-between border-b border-hair px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${running ? "animate-heartbeat bg-amber" : "bg-ink-faint"}`}
          />
          <span className="label-caps font-mono text-[9.5px] text-ink-mid">
            ARIA Reasoning
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Resume animation" : "Pause animation"}
            className="font-mono text-[9px] text-ink-lo transition-colors hover:text-amber"
          >
            {paused ? "play" : "pause"}
          </button>
          <button
            onClick={() => setCollapsed(true)}
            aria-label="Collapse ARIA panel"
            className="text-ink-mid transition-colors hover:text-amber"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 3 L11 8 L6 13" />
            </svg>
          </button>
        </div>
      </header>

      <div
        className={`flex-1 overflow-y-auto px-4 py-3 transition-opacity ${
          running ? "opacity-100" : "opacity-60"
        }`}
      >
        {reasoning.length === 0 ? (
          <p className="font-mono text-[10.5px] text-ink-lo">
            idle — no active reasoning. ARIA is watching.
          </p>
        ) : (
          <ReasoningChain steps={reasoning} thinking={running} animate={!paused} />
        )}
      </div>
    </aside>
  );
}
