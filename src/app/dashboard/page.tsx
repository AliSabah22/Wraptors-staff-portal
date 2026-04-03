import { Suspense } from "react";
import { requireAuth } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/role-permissions";
import { createClient } from "@/lib/supabase/server";
import {
  buildServiceNameToIdMap,
  mapDbJobRowToServiceJob,
  mapDbQuoteRowToQuoteRequest,
} from "@/lib/server-data/hydration-mappers";
import type { QuoteRequest } from "@/types";
import {
  DashboardPage,
  type DashboardHydration,
} from "@/components/dashboard/dashboard-page";

async function loadDashboardHydration(): Promise<DashboardHydration> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: serviceRows } = await supabase.from("services").select("id, name").eq("is_active", true);
  const serviceNameToId = buildServiceNameToIdMap(
    (serviceRows ?? []) as unknown as Record<string, unknown>[]
  );

  let jobQuery = supabase
    .from("jobs")
    .select(
      `
      *,
      customers(id, full_name, email, phone, notes, membership_status, created_at, updated_at),
      vehicles(id, customer_id, make, model, year, color, vin, license_plate, created_at, updated_at)
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (!hasPermission(user.role, "jobs.view_operational")) {
    jobQuery = jobQuery.eq("technician_id", user.id);
  }

  const { data: jobRows } = await jobQuery;
  const jobs = (jobRows ?? []).map((r) =>
    mapDbJobRowToServiceJob(r as unknown as Record<string, unknown>, serviceNameToId)
  );

  let quotes: QuoteRequest[] = [];
  if (hasPermission(user.role, "quotes.view")) {
    const { data: qRows } = await supabase
      .from("quote_requests")
      .select(
        "*, customers(full_name, membership_status), vehicles(make, model, year)"
      )
      .order("created_at", { ascending: false })
      .limit(100);
    quotes = (qRows ?? []).map((row) =>
      mapDbQuoteRowToQuoteRequest(row as unknown as Record<string, unknown>)
    );
  }

  let monthlyRevenueMtd = 0;
  if (hasPermission(user.role, "invoices.view")) {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const { data: inv } = await supabase
      .from("invoices")
      .select("total,status,created_at")
      .gte("created_at", start.toISOString());
    monthlyRevenueMtd = (inv ?? []).reduce((sum, row) => {
      if (row.status === "paid" || row.status === "sent") {
        return sum + Number(row.total ?? 0);
      }
      return sum;
    }, 0);
  }

  return { jobs, quotes, monthlyRevenueMtd };
}

export default async function DashboardPageRoute() {
  const hydration = await loadDashboardHydration();

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-wraptors-muted">
          Loading dashboard…
        </div>
      }
    >
      <DashboardPage hydration={hydration} />
    </Suspense>
  );
}
