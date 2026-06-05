"use client";

/**
 * A tiny axis-free sparkline. The path "grows" in via stroke-dashoffset.
 * `anomaly` fills a faint amber wash behind the line to mark the incident shape.
 */
export function Sparkline({
  points,
  color = "#aac6d6",
  anomaly = false,
  width = 120,
  height = 30,
}: {
  points: number[];
  color?: string;
  anomaly?: boolean;
  width?: number;
  height?: number;
}) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * step;
    const y = height - ((p - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });

  const d = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${d} L${width},${height} L0,${height} Z`;
  const len = 260;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {anomaly && <path d={area} fill={color} opacity={0.07} />}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={len}
        style={{ animation: "draw-x 0.9s cubic-bezier(0.16,1,0.3,1) forwards" }}
      >
        <animate
          attributeName="stroke-dashoffset"
          from={len}
          to="0"
          dur="0.9s"
          fill="freeze"
          calcMode="spline"
          keySplines="0.16 1 0.3 1"
        />
      </path>
    </svg>
  );
}
