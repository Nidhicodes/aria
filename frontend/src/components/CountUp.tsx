"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Smoothly counts from a previous value to `value`. Used for metric readouts
 * and the confidence score. Honors prefers-reduced-motion (snaps instantly).
 */
export function CountUp({
  value,
  duration = 600,
  decimals = 0,
  className = "",
  suffix = "",
}: {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = fromRef.current;
    const to = value;
    if (reduce || from === to) {
      setDisplay(to);
      fromRef.current = to;
      return;
    }
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      // ease-in-out cubic
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      setDisplay(from + (to - from) * e);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return (
    <span className={className}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
