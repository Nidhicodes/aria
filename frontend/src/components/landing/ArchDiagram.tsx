"use client";

/**
 * Spatial map (not a flowchart): Dynatrace and Arize as sources of truth at the
 * edges, ARIA reasoning at the center, signal pulses traveling along delicate
 * curved paths toward the core.
 */
export function ArchDiagram() {
  return (
    <svg
      viewBox="0 0 900 320"
      className="h-auto w-full"
      role="img"
      aria-label="Dynatrace and Arize Phoenix feed signals into ARIA's reasoning core."
    >
      <defs>
        <radialGradient id="core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d6a052" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#d6a052" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Curved signal paths */}
      {[
        { d: "M150,90 C360,90 380,160 450,160", c: "#aac6d6" },
        { d: "M150,230 C360,230 380,160 450,160", c: "#aac6d6" },
        { d: "M750,90 C540,90 520,160 450,160", c: "#d6a052" },
        { d: "M750,230 C540,230 520,160 450,160", c: "#d6a052" },
      ].map((p, i) => (
        <g key={i}>
          <path d={p.d} fill="none" stroke={p.c} strokeOpacity={0.18} strokeWidth={1} />
          <circle r={2.4} fill={p.c}>
            <animateMotion dur={`${3.6 + i * 0.4}s`} repeatCount="indefinite" path={p.d} />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur={`${3.6 + i * 0.4}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}

      {/* Source nodes — left (Dynatrace) */}
      <SourceNode x={70} y={90} label="Dynatrace" sub="infrastructure" tint="#aac6d6" />
      <SourceNode x={70} y={230} label="metrics · logs" sub="problems · k8s" tint="#aac6d6" />

      {/* Source nodes — right (Arize) */}
      <SourceNode x={680} y={90} label="Arize Phoenix" sub="model quality" tint="#d6a052" align="end" />
      <SourceNode x={680} y={230} label="traces · evals" sub="hallucination" tint="#d6a052" align="end" />

      {/* Core */}
      <circle cx={450} cy={160} r={70} fill="url(#core)" />
      <circle cx={450} cy={160} r={44} fill="#181613" stroke="#d6a052" strokeOpacity={0.5} />
      <text
        x={450}
        y={156}
        textAnchor="middle"
        fill="#ffffff"
        style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em" }}
      >
        ARIA
      </text>
      <text
        x={450}
        y={174}
        textAnchor="middle"
        fill="#9a948b"
        style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.08em" }}
      >
        GEMINI · ADK
      </text>
    </svg>
  );
}

function SourceNode({
  x,
  y,
  label,
  sub,
  tint,
  align = "start",
}: {
  x: number;
  y: number;
  label: string;
  sub: string;
  tint: string;
  align?: "start" | "end";
}) {
  const tx = align === "end" ? x + 70 : x;
  return (
    <g>
      <circle cx={align === "end" ? x + 70 : x} cy={y} r={4} fill={tint} fillOpacity={0.8} />
      <text
        x={align === "end" ? tx - 12 : tx + 12}
        y={y - 2}
        textAnchor={align}
        fill="#ece7df"
        style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
      >
        {label}
      </text>
      <text
        x={align === "end" ? tx - 12 : tx + 12}
        y={y + 12}
        textAnchor={align}
        fill="#6a655d"
        style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, letterSpacing: "0.06em" }}
      >
        {sub}
      </text>
    </g>
  );
}
