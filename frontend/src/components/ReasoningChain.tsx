"use client";

import { useEffect, useRef, useState } from "react";

import { useTypewriter } from "@/lib/useTypewriter";
import type { ReasoningKind, ReasoningStep } from "@/lib/types";

// Map engine kinds to the three editorial "thought types".
const THOUGHT_LABEL: Record<ReasoningKind, string> = {
  pull: "PULLING",
  correlate: "CORRELATING",
  hypothesis: "CORRELATING",
  root_cause: "CONCLUSION",
  plan: "PLANNING",
  execute: "EXECUTING",
  report: "REPORTING",
  info: "",
};

function isConclusion(kind: ReasoningKind) {
  return kind === "root_cause";
}

function Cursor() {
  return (
    <span className="ml-0.5 inline-block h-[1.05em] w-[0.5ch] -translate-y-[0.06em] animate-cursor-blink bg-amber align-middle" />
  );
}

function Line({
  step,
  isLatest,
  newSection,
  animate,
  onTyped,
}: {
  step: ReasoningStep;
  isLatest: boolean;
  newSection: boolean;
  animate: boolean;
  onTyped: () => void;
}) {
  const { shown, done } = useTypewriter(step.text, {
    enabled: isLatest && animate,
    speed: 14,
    onDone: onTyped,
  });
  const [hover, setHover] = useState(false);
  const conclusion = isConclusion(step.kind);

  return (
    <div className="group">
      {newSection && (
        <div className="mb-2 mt-4 flex items-center gap-2 first:mt-0">
          <span className="rule-draw h-px w-6 origin-left animate-draw-x bg-amber/40" />
          <span className="label-caps font-mono text-[9.5px] text-amber/70">
            {THOUGHT_LABEL[step.kind]}
          </span>
          <span className="rule-draw h-px flex-1 origin-left animate-draw-x bg-hair" />
        </div>
      )}
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`flex items-start gap-2.5 py-1 transition-colors ${
          isLatest ? "text-ink-hi" : hover ? "text-ink-hi" : "text-ink-mid"
        }`}
      >
        <span className="mt-[3px] shrink-0 text-[11px] opacity-70">{step.icon}</span>
        <p
          className={`font-mono text-[12.5px] leading-data tracking-data ${
            conclusion ? "text-[13.5px] font-medium text-ink-hi" : ""
          } ${isLatest && !done ? "phosphor" : ""}`}
        >
          {shown}
          {isLatest && !done && <Cursor />}
        </p>
        <span
          className={`ml-auto shrink-0 self-center font-mono text-[9px] text-ink-lo transition-opacity ${
            hover ? "opacity-100" : "opacity-0"
          }`}
        >
          {new Date(step.created_at).toISOString().slice(11, 19)}
        </span>
      </div>
    </div>
  );
}

export function ReasoningChain({
  steps,
  thinking,
  animate = true,
}: {
  steps: ReasoningStep[];
  thinking: boolean;
  animate?: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollToEnd = () =>
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  useEffect(() => {
    scrollToEnd();
  }, [steps.length]);

  if (steps.length === 0 && !thinking) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="font-mono text-[11px] tracking-data text-ink-lo">
          awaiting signal…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {steps.map((s, i) => {
        const prev = steps[i - 1];
        const newSection =
          !prev || THOUGHT_LABEL[prev.kind] !== THOUGHT_LABEL[s.kind];
        return (
          <Line
            key={s.id}
            step={s}
            isLatest={i === steps.length - 1}
            newSection={newSection && !!THOUGHT_LABEL[s.kind]}
            animate={animate}
            onTyped={scrollToEnd}
          />
        );
      })}
      {thinking && steps.length === 0 && (
        <div className="flex items-center gap-2 py-1 font-mono text-[12px] text-ink-mid">
          <span className="phosphor">ARIA is reasoning</span>
          <Cursor />
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
