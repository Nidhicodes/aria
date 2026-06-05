"use client";

import Link from "next/link";

import { FlowField } from "@/components/FlowField";
import { Wordmark } from "@/components/TopBar";
import { ArchDiagram } from "@/components/landing/ArchDiagram";
import { AskAria } from "@/components/landing/AskAria";
import { StoryDemo } from "@/components/landing/StoryDemo";
import { REPO_URL } from "@/lib/links";

export default function Landing() {
  return (
    <>
      <FlowField />

      <div className="fixed left-5 top-5 z-30">
        <Wordmark size={20} />
      </div>
      <Link
        href="/dashboard"
        className="fixed right-5 top-5 z-30 font-mono text-[11px] text-ink-mid transition-colors hover:text-amber"
      >
        open console →
      </Link>

      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <span
          className="mb-6 animate-fade-up label-caps font-mono text-[10px] text-amber/70"
          style={{ animationDelay: "0ms" }}
        >
          Autonomous incident response for AI
        </span>
        <h1 className="display-hero max-w-[18ch] animate-fade-up text-[clamp(44px,7.5vw,92px)] text-ink-white">
          The colleague who never
          <br />
          sleeps through an outage.
        </h1>
        <p
          className="mt-7 max-w-[36rem] animate-fade-up text-[clamp(16px,2vw,19px)] leading-body text-ink-mid"
          style={{ animationDelay: "120ms" }}
        >
          ARIA watches your AI in production, catches trouble before your users
          do, and fixes it — pausing only when it needs your call.
        </p>

        <div
          className="mt-10 flex animate-fade-up flex-col items-center"
          style={{ animationDelay: "220ms" }}
        >
          <AskAria />
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] text-ink-faint">
          ↓ see how it thinks
        </div>
      </section>

      {/* ─────────────────────── The feeling ─────────────────────── */}
      <section className="relative border-t border-hair py-28">
        <div className="mx-auto max-w-[760px] px-6 text-center">
          <h2 className="display-title text-[clamp(26px,4vw,40px)] leading-snug text-ink-white">
            The worst outages don&apos;t announce themselves.
          </h2>
          <p className="mx-auto mt-6 max-w-[44ch] text-[16px] leading-body text-ink-mid">
            Your AI can quietly start giving bad answers while every server looks
            fine. By the time someone notices and connects the dots, it&apos;s
            already been wrong for a while — and the trust is already spent.
          </p>
          <p className="mx-auto mt-4 max-w-[44ch] text-[16px] leading-body text-ink-hi">
            ARIA notices in seconds, and explains exactly what happened in plain
            language.
          </p>
        </div>
      </section>

      {/* ───────────────── Story demo (scroll-driven) ───────────────── */}
      <section className="relative border-t border-hair">
        <div className="mx-auto max-w-[760px] px-6 pt-24 text-center">
          <span className="label-caps font-mono text-[10px] text-amber/70">
            Watch ARIA work
          </span>
          <h2 className="display-title mt-4 text-[clamp(26px,4vw,40px)] text-ink-white">
            One incident, told the way you&apos;d want to hear it.
          </h2>
        </div>
        <StoryDemo />
      </section>

      {/* ───────────────── How it helps (plain) ───────────────── */}
      <section className="relative border-t border-hair py-28">
        <div className="mx-auto max-w-[1000px] px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {[
              {
                t: "Always watching",
                b: "ARIA keeps an eye on both your systems and your AI at the same time — the two things that usually live in separate tools.",
              },
              {
                t: "Thinks it through",
                b: "When something breaks, it reasons out loud, connects the dots across everything it sees, and tells you the real cause — not just the symptom.",
              },
              {
                t: "You stay in control",
                b: "Safe fixes happen on their own. Anything risky waits for a single click from you. Then ARIA writes up the whole story.",
              },
            ].map((c, i) => (
              <div key={c.t}>
                <span className="display-title text-[36px] text-amber/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="display-title mt-2 text-[21px] text-ink-white">
                  {c.t}
                </h3>
                <p className="mt-3 text-[14.5px] leading-body text-ink-mid">{c.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── Quiet architecture ───────────────── */}
      <section className="relative border-t border-hair py-28">
        <div className="mx-auto max-w-[1000px] px-6 text-center">
          <span className="label-caps font-mono text-[10px] text-amber/70">
            One mind, two views
          </span>
          <h2 className="display-title mx-auto mt-4 max-w-[20ch] text-[clamp(24px,4vw,38px)] text-ink-white">
            ARIA sees what no single dashboard can.
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-[15px] leading-body text-ink-mid">
            It listens to your infrastructure and your AI together, so it catches
            the moment one starts dragging down the other.
          </p>
          <div className="mt-14">
            <ArchDiagram />
          </div>
        </div>
      </section>

      {/* ───────────────── Closing CTA ───────────────── */}
      <section className="relative border-t border-hair py-32 text-center">
        <div className="mx-auto max-w-[760px] px-6">
          <h2 className="display-hero text-[clamp(36px,6vw,72px)] text-ink-white">
            Sleep through the night.
            <br />
            ARIA has the watch.
          </h2>
          <Link
            href="/dashboard"
            className="btn-rise mt-10 inline-block border border-amber px-8 py-3 font-mono text-[13px] font-medium text-amber transition-colors hover:text-void"
          >
            Enter the console
          </Link>
        </div>
      </section>

      {/* ───────────────── Footer ───────────────── */}
      <footer className="border-t border-hair bg-void">
        <div className="mx-auto flex max-w-[1000px] flex-wrap items-center justify-between gap-4 px-6 py-8">
          <Wordmark size={16} />
          <nav className="flex gap-6 font-mono text-[11px] text-ink-mid">
            <Link href="/dashboard" className="transition-colors hover:text-amber">
              Console
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-amber"
            >
              Source
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-heartbeat rounded-full bg-amber" />
            <span className="label-caps font-mono text-[9px] text-ink-lo">
              ARIA online
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
