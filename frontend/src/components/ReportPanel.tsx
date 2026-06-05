"use client";

import { useMemo, useState } from "react";

function inline(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-medium text-ink-white">$1</strong>');
}

function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("# ")) {
      closeList();
      out.push(
        `<h1 class="display-title text-[22px] text-ink-white mt-1 mb-1">${inline(line.slice(2))}</h1>`,
      );
    } else if (line.startsWith("## ")) {
      closeList();
      out.push(
        `<h2 class="display-title text-[15px] text-amber/90 mt-5 mb-1">${inline(line.slice(3))}</h2>`,
      );
    } else if (/^\d+\.\s/.test(line)) {
      closeList();
      out.push(
        `<div class="font-mono text-[12px] text-ink-mid ml-1 leading-data">${inline(line)}</div>`,
      );
    } else if (line.startsWith("- ")) {
      if (!inList) {
        out.push('<ul class="space-y-1 mt-1">');
        inList = true;
      }
      out.push(
        `<li class="text-[13px] text-ink-mid flex gap-2"><span class="text-amber/60">—</span><span>${inline(line.slice(2))}</span></li>`,
      );
    } else if (line === "") {
      closeList();
    } else {
      closeList();
      out.push(
        `<p class="text-[13.5px] leading-body text-ink-mid mt-1">${inline(line)}</p>`,
      );
    }
  }
  closeList();
  return out.join("\n");
}

export function ReportPanel({
  markdown,
  title = "incident",
}: {
  markdown: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const html = useMemo(() => renderMarkdown(markdown), [markdown]);
  if (!markdown) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      /* clipboard may be unavailable; ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const exportMd = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aria-incident-${slug || "report"}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const send = () => {
    // No mail backend in the demo — hand off to the user's mail client with the
    // report prefilled, so the button does something real and useful.
    const subject = encodeURIComponent(`ARIA incident report — ${title}`);
    const body = encodeURIComponent(markdown);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    setSent(true);
    setTimeout(() => setSent(false), 1800);
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-2 flex items-center justify-between border-b border-hair pb-2">
        <span className="label-caps font-mono text-[9.5px] text-ink-lo">
          Incident report
        </span>
        <div className="flex gap-3">
          <button
            onClick={copy}
            className="font-mono text-[10px] text-ink-mid transition-colors hover:text-amber"
          >
            {copied ? "copied ✓" : "copy markdown"}
          </button>
          <button
            onClick={exportMd}
            className="font-mono text-[10px] text-ink-mid transition-colors hover:text-amber"
          >
            export .md
          </button>
          <button
            onClick={send}
            className="font-mono text-[10px] text-amber/90 transition-colors hover:text-amber"
          >
            {sent ? "opening…" : "send report →"}
          </button>
        </div>
      </div>
      <div className="space-y-0.5" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
