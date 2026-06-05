"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Horizontal wipe on route change — a thin amber leading edge sweeps across the
 * viewport while the old content fades behind it and the new fades in ahead.
 * ~350ms total. Disabled under prefers-reduced-motion (reduces to a plain fade).
 */
export function PageWipe() {
  const pathname = usePathname();
  const [playing, setPlaying] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    setPlaying(true);
    const t = setTimeout(() => setPlaying(false), 380);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!playing) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
      <div
        className="absolute inset-y-0 left-0 w-full"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,9,8,0) 0%, rgba(10,9,8,0.9) 70%, rgba(214,160,82,0.9) 100%)",
          animation: "wipe-sweep 0.38s cubic-bezier(0.7,0,0.3,1) forwards",
        }}
      />
      <style jsx>{`
        @keyframes wipe-sweep {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
