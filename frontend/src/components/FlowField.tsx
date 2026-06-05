"use client";

import { useEffect, useRef } from "react";

/**
 * Living atmosphere — a glacial flow field of particles drifting across the
 * void. Barely visible (4–10% opacity). Particles near the cursor drift very
 * slightly toward it, as if curious. During an incident the field accelerates
 * fractionally and lifts in opacity. Falls back to fully static under
 * prefers-reduced-motion or when the tab is hidden / perf drops.
 */
export function FlowField({ active = false, calm = false }: { active?: boolean; calm?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const calmRef = useRef(calm);
  calmRef.current = calm;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number };
    let particles: P[] = [];

    const mouse = { x: -9999, y: -9999 };

    const seed = () => {
      const count = Math.min(90, Math.floor((w * h) / 22000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        // Glacial base velocity.
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.4 + 0.4,
        a: Math.random() * 0.5 + 0.5,
      }));
    };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    let lastT = performance.now();
    let fps = 60;

    const draw = (t: number) => {
      const dt = Math.min(t - lastT, 50);
      lastT = t;
      fps = fps * 0.9 + (1000 / Math.max(dt, 1)) * 0.1;

      ctx.clearRect(0, 0, w, h);

      const incident = activeRef.current;
      const stillness = calmRef.current;
      const speed = incident ? 1.9 : stillness ? 0.25 : 1;
      const baseOpacity = incident ? 0.1 : stillness ? 0.035 : 0.055;

      for (const p of particles) {
        // Curiosity: drift slightly toward the cursor when near.
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 26000) {
          const f = (1 - d2 / 26000) * 0.0016;
          p.vx += dx * f;
          p.vy += dy * f;
        }

        // Gentle damping back toward glacial drift.
        p.vx *= 0.985;
        p.vy *= 0.985;

        p.x += p.vx * speed * (dt / 16.67);
        p.y += p.vy * speed * (dt / 16.67);

        // Wrap.
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = incident
          ? `rgba(214,160,82,${baseOpacity * p.a})`
          : `rgba(170,198,214,${baseOpacity * p.a})`;
        ctx.fill();
      }

      // Faint connective filaments between near neighbors.
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 12000) {
            const o = (1 - d2 / 12000) * baseOpacity * 0.5;
            ctx.strokeStyle = incident
              ? `rgba(214,160,82,${o})`
              : `rgba(170,198,214,${o})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Bail to static if perf collapses.
      if (fps < 24) {
        cancelAnimationFrame(raf);
        return;
      }
      raf = requestAnimationFrame(draw);
    };

    if (!reduce) {
      raf = requestAnimationFrame(draw);
    } else {
      // Static single paint.
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(170,198,214,0.04)`;
        ctx.fill();
      }
    }

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduce) {
        lastT = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
