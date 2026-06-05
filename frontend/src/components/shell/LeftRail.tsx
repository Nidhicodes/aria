"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Item = { href: string; label: string; icon: React.ReactNode };

const ICONS = {
  overview: (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="3" y="3" width="6" height="6" /><rect x="11" y="3" width="6" height="6" />
      <rect x="3" y="11" width="6" height="6" /><rect x="11" y="11" width="6" height="6" />
    </svg>
  ),
  incident: (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M10 2 L18 16 H2 Z" /><line x1="10" y1="8" x2="10" y2="11" /><circle cx="10" cy="13.5" r="0.6" fill="currentColor" />
    </svg>
  ),
  config: (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="10" cy="10" r="3" />
      <path d="M10 1v3M10 16v3M1 10h3M16 10h3M3.5 3.5l2 2M14.5 14.5l2 2M16.5 3.5l-2 2M5.5 14.5l-2 2" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 9 L10 3 L17 9 V17 H3 Z" />
    </svg>
  ),
};

const ITEMS: Item[] = [
  { href: "/dashboard", label: "Overview", icon: ICONS.overview },
  { href: "/dashboard/incident", label: "Active Incident", icon: ICONS.incident },
  { href: "/dashboard/config", label: "Configuration", icon: ICONS.config },
  { href: "/", label: "Landing", icon: ICONS.home },
];

export function LeftRail() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  return (
    <nav
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`sticky top-12 z-20 hidden h-[calc(100vh-3rem)] shrink-0 flex-col border-r border-hair bg-void/60 py-4 transition-[width] duration-200 md:flex ${
        expanded ? "w-[200px]" : "w-[56px]"
      }`}
    >
      {ITEMS.map((it) => {
        const active =
          it.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`group relative mx-2 flex items-center gap-3 overflow-hidden rounded px-3 py-2.5 transition-colors ${
              active ? "bg-elevated text-amber" : "text-ink-mid hover:text-ink-hi"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-0 h-full w-[3px] bg-amber" />
            )}
            <span className="shrink-0">{it.icon}</span>
            <span
              className={`whitespace-nowrap text-[13px] transition-opacity duration-200 ${
                expanded ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {it.label}
            </span>
            {!active && (
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-amber transition-all duration-150 group-hover:w-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
