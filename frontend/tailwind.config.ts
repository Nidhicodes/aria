import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // ── Surface stack: warm ink, lifted in tiny increments ──
        void: "#0a0908",
        canvas: "#100f0d",
        surface: "#181613",
        elevated: "#211e1a",
        hair: "#2a2622", // border midpoint
        // ── Accents (used sparingly) ──
        amber: {
          DEFAULT: "#d6a052", // candlelight through old glass
          bright: "#ecbb6a",
          dim: "#8f7038",
        },
        ice: "#aac6d6", // clinical data readouts
        // ── Severity ──
        sev: {
          p0: "#9e3b40", // dried blood crimson
          p1: "#b5663a", // burnt orange
          p2: "#c79a5a", // muted amber
          p3: "#6b7d8a", // steel blue-gray
          ok: "#6f967c", // cool copper green
        },
        ink: {
          white: "#ffffff",
          hi: "#ece7df", // warm off-white (primary text)
          mid: "#9a948b",
          lo: "#6a655d",
          faint: "#403c37",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        hero: "-0.04em",
        title: "-0.02em",
        label: "0.08em",
        data: "-0.01em",
      },
      lineHeight: {
        display: "0.95",
        body: "1.65",
        data: "1.6",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "draw-x": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "cursor-blink": {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "heartbeat": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.15)" },
        },
        "sev-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.8s ease-out both",
        "draw-x": "draw-x 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "cursor-blink": "cursor-blink 1.05s step-end infinite",
        "heartbeat": "heartbeat 3.2s ease-in-out infinite",
        "sev-pulse": "sev-pulse 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
