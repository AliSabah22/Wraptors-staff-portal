"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useJobsStore, useQuotesStore } from "@/stores";
import type { QuoteRequest, ServiceJob } from "@/types";
import { usePermissions } from "@/hooks/usePermissions";
import { useRole } from "@/hooks/useRole";
import { TechnicianDashboard } from "@/components/dashboard/technician-dashboard";
import { ReceptionistDashboard } from "@/components/dashboard/receptionist-dashboard";
import { CEOCommandCenter } from "@/components/dashboard/ceo-command-center";

export type DashboardHydration = {
  jobs: ServiceJob[];
  quotes: QuoteRequest[];
  monthlyRevenueMtd: number;
};

export function DashboardPage({ hydration }: { hydration?: DashboardHydration | null }) {
  const { role } = useRole();
  const { hasPermission } = usePermissions();
  const searchParams = useSearchParams();
  const unauthorized = searchParams.get("error") === "unauthorized";

  useEffect(() => {
    if (!hydration) return;
    const apply = () => {
      useJobsStore.getState().setJobs(hydration.jobs);
      useQuotesStore.getState().setQuotes(hydration.quotes);
    };
    apply();
    return useJobsStore.persist.onFinishHydration(apply);
  }, [hydration]);

  if (!role) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-wraptors-gold border-t-transparent" />
      </div>
    );
  }

  let content: React.ReactNode = <CEODashboard />;
  if (
    hasPermission("dashboard.view_personal") &&
    !hasPermission("dashboard.view_operational") &&
    !hasPermission("dashboard.view_full")
  ) {
    content = <TechnicianDashboard />;
  } else if (hasPermission("dashboard.view_operational") && !hasPermission("dashboard.view_full")) {
    content = <ReceptionistDashboard />;
  }

  return (
    <div className="space-y-4">
      {unauthorized && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
          You don&apos;t have permission to access that page.
        </div>
      )}
      {content}
    </div>
  );
}

export function CEODashboard() {
  return <CEOCommandCenter />;
}
