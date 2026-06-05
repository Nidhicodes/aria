"use client";

import { useEffect, useRef, useState } from "react";

// A plain-language retelling — no raw metrics, just ARIA thinking out loud.
const BEATS = [
  {
    tag: "All calm",
    glyph: "◦",
    text: "Everything looks healthy. ARIA is quietly keeping watch.",
    tone: "ok",
  },
  {
    tag: "Something's off",
    glyph: "△",
    text: "A server starts running hot — and at the very same moment, the answers start going wrong.",
    tone: "warn",
  },
  {
    tag: "ARIA connects it",
    glyph: "✦",
    text: "These aren't two problems. The overloaded server is feeding the AI less to work with, so it's starting to guess.",
    tone: "amber",
  },
  {
    tag: "The fix",
    glyph: "▶",
    text: "ARIA gives the server more room and adjusts how the AI handles the gap. One change needs your okay.",
    tone: "amber",
  },
  {
    tag: "Resolved",
    glyph: "◆",
    text: "Quality is back to normal. ARIA writes up what happened — and how to make sure it doesn't again.",
    tone: "ok",
  },
];

const tone = {
  ok: { text: "text-sev-ok", glow: "rgba(111,150,124,0.16)", dot: "bg-sev-ok" },
  warn: { text: "text-sev-p1", glow: "rgba(181,102,58,0.18)", dot: "bg-sev-p1" },
  amber: { text: "text-amber", glow: "rgba(214,160,82,0.18)", dot: "bg-amber" },
} as const;

export function StoryDemo() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const p = total > 0 ? scrolled / total : reduce ? 1 : 0;
      // Map scroll progress to a beat index, with a little dwell per beat.
      const i = Math.min(BEATS.length - 1, Math.floor(p * BEATS.length * 0.999));
      setIdx(i);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const beat = BEATS[idx];
  const t = tone[beat.tone as keyof typeof tone];

  return (
    <div ref={wrapRef} className="relative h-[420vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* Ambient tone glow that shifts with the story */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] transition-all duration-700"
          style={{ background: t.glow }}
        />

        {/* Progress rail */}
        <div className="absolute left-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:flex lg:left-12">
          {BEATS.map((b, i) => {
            const done = i <= idx;
            return (
              <div key={i} className="flex items-center gap-3">
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
                    i === idx
                      ? `${tone[b.tone as keyof typeof tone].dot} scale-150`
                      : done
                        ? "bg-ink-mid"
                        : "bg-ink-faint"
                  }`}
                />
                <span
                  className={`label-caps font-mono text-[8px] transition-opacity duration-500 ${
                    i === idx ? "text-ink-mid opacity-100" : "opacity-0"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            );
          })}
        </div>

        {/* The single, fully-visible beat */}
        <div className="relative mx-auto w-full max-w-[720px] px-6 text-center">
          <div key={idx} className="animate-fade-up">
            <div className="mb-5 flex items-center justify-center gap-3">
              <span className={`text-[18px] ${t.text}`}>{beat.glyph}</span>
              <span className={`label-caps font-mono text-[10px] ${t.text}`}>
                {beat.tag}
              </span>
            </div>
            <p className="mx-auto max-w-[20ch] text-[clamp(24px,3.6vw,40px)] leading-snug text-ink-white">
              {beat.text}
            </p>
          </div>

          {/* Step counter + thinking cursor */}
          <div className="mt-10 flex items-center justify-center gap-2 font-mono text-[10px] text-ink-lo">
            <span>
              {String(idx + 1).padStart(2, "0")} / {String(BEATS.length).padStart(2, "0")}
            </span>
            {idx < BEATS.length - 1 ? (
              <>
                <span className="text-ink-faint">·</span>
                <span>keep scrolling</span>
                <span className="inline-block h-[1em] w-[0.5ch] animate-cursor-blink bg-amber align-middle" />
              </>
            ) : (
              <>
                <span className="text-ink-faint">·</span>
                <span className="text-sev-ok">incident closed</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
