import type { Metadata } from "next";
import { body, display, mono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARIA — Autonomous Reasoning & Incident Agent",
  description:
    "Your AI stack, under permanent watch. ARIA reasons across infrastructure (Dynatrace) and model quality (Arize Phoenix) to resolve incidents single dashboards miss.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="min-h-screen bg-void-grain antialiased">{children}</body>
    </html>
  );
}
