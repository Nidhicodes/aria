"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CHIPS = [
  "Watch my production AI",
  "Why is quality dropping?",
  "Something feels slow",
];

/**
 * Emergent-style focal input — you "talk to" ARIA. It's conversational, not
 * technical. Submitting (or picking a suggestion) carries you into the console.
 */
export function AskAria() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const go = () => router.push("/dashboard");

  return (
    <div className="w-full max-w-[560px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        className="group flex items-center gap-2 border border-hair bg-canvas/80 p-2 pl-4 transition-colors focus-within:border-amber/60"
      >
        <span className="select-none font-mono text-[14px] text-amber">›</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask ARIA to keep watch over your AI…"
          aria-label="Ask ARIA"
          className="flex-1 bg-transparent text-[14px] text-ink-hi placeholder:text-ink-lo focus:outline-none"
        />
        <button
          type="submit"
          className="btn-rise shrink-0 border border-amber px-4 py-2 font-mono text-[12px] font-medium text-amber transition-colors hover:text-void"
        >
          Begin
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={go}
            className="rounded-full border border-hair px-3 py-1 text-[11.5px] text-ink-mid transition-colors hover:border-amber/50 hover:text-amber"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
