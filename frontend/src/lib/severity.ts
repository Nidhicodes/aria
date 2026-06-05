import type { Severity } from "./types";

// Severity never relies on color alone — each has a glyph + label too.
export const SEVERITY: Record<
  Severity,
  { label: string; glyph: string; text: string; bar: string; dot: string }
> = {
  critical: {
    label: "P0",
    glyph: "▲",
    text: "text-sev-p0",
    bar: "bg-sev-p0",
    dot: "bg-sev-p0",
  },
  warning: {
    label: "P2",
    glyph: "◆",
    text: "text-sev-p2",
    bar: "bg-sev-p2",
    dot: "bg-sev-p2",
  },
  info: {
    label: "P3",
    glyph: "●",
    text: "text-sev-p3",
    bar: "bg-sev-p3",
    dot: "bg-sev-p3",
  },
  ok: {
    label: "OK",
    glyph: "■",
    text: "text-sev-ok",
    bar: "bg-sev-ok",
    dot: "bg-sev-ok",
  },
};

export function sourceMeta(source: string) {
  return source === "dynatrace"
    ? { label: "Dynatrace", kind: "INFRA", tint: "text-ice" }
    : { label: "Arize Phoenix", kind: "LLM", tint: "text-amber" };
}
