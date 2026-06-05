"use client";

import { usePathname } from "next/navigation";

import { FlowField } from "@/components/FlowField";
import { TopBar } from "@/components/TopBar";
import { AriaPanel } from "@/components/shell/AriaPanel";
import { LeftRail } from "@/components/shell/LeftRail";
import { MobileAriaButton } from "@/components/shell/MobileAriaButton";
import { PageWipe } from "@/components/shell/PageWipe";
import { IncidentProvider, useIncident } from "@/lib/store";

function Shell({ children }: { children: React.ReactNode }) {
  const { phase, health, running } = useIncident();
  const pathname = usePathname();
  const incidentActive = running && phase !== "calm";
  const calm = pathname === "/dashboard/config";

  return (
    <>
      <FlowField active={incidentActive} calm={calm} />
      <PageWipe />
      <TopBar phase={phase} health={health} />
      <div className="flex">
        <LeftRail />
        <div className="min-w-0 flex-1">{children}</div>
        <AriaPanel />
      </div>
      <MobileAriaButton />
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IncidentProvider>
      <Shell>{children}</Shell>
    </IncidentProvider>
  );
}
