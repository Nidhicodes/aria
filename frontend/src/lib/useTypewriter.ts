"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Types `text` out character-by-character at a slightly variable speed, as if a
 * thoughtful intelligence were composing it. Honors prefers-reduced-motion by
 * revealing the full text immediately. Calls `onDone` once when finished.
 */
export function useTypewriter(
  text: string,
  opts: { speed?: number; enabled?: boolean; onDone?: () => void } = {},
) {
  const { speed = 16, enabled = true, onDone } = opts;
  const [shown, setShown] = useState(enabled ? "" : text);
  const [done, setDone] = useState(!enabled);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!enabled || reduce) {
      setShown(text);
      setDone(true);
      onDoneRef.current?.();
      return;
    }

    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    setShown("");
    setDone(false);

    const tick = () => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        setDone(true);
        onDoneRef.current?.();
        return;
      }
      // Variable cadence: punctuation pauses, slight jitter elsewhere.
      const ch = text[i - 1];
      let delay = speed + Math.random() * speed * 0.8;
      if (ch === "," || ch === ";") delay += 90;
      if (ch === "." || ch === ":" || ch === "—") delay += 160;
      timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [text, speed, enabled]);

  return { shown, done };
}
