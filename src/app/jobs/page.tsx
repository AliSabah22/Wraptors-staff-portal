import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/role-permissions";
import {
  buildServiceNameToIdMap,
  mapDbCustomerRowToCustomer,
  mapDbJobRowToServiceJob,
  mapDbVehicleRowToVehicle,
} from "@/lib/server-data/hydration-mappers";
import { JobsPageClient } from "./jobs-page-client";

export default async function JobsPage() {
  const user = await requireAuth();
  if (
    !hasPermission(user.role, "jobs.view_operational") &&
    !hasPermission(user.role, "jobs.view_assigned")
  ) {
    redirect("/dashboard?error=unauthorized");
  }
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
      vehicles(id, customer_id, make, model, year, color, vin, license_plate, created_at, updated_at),
      staff_users!technician_id(id, full_name, avatar_url)
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (!hasPermission(user.role, "jobs.view_operational")) {
    jobQuery = jobQuery.eq("technician_id", user.id);
  }

  const { data: jobRows } = await jobQuery;

  const rows = (jobRows ?? []) as unknown as Record<string, unknown>[];
  const initialJobs = rows.map((r) => mapDbJobRowToServiceJob(r, serviceNameToId));

  const customersById = new Map<string, Record<string, unknown>>();
  const vehiclesById = new Map<string, Record<string, unknown>>();
  for (const r of rows) {
    const c = r.customers as Record<string, unknown> | null | undefined;
    if (c && c.id != null) {
      const id = String(c.id);
      if (!customersById.has(id)) {
        customersById.set(id, { ...c, vehicles: [] });
      }
    }
    const v = r.vehicles as Record<string, unknown> | null | undefined;
    if (v && v.id != null) {
      vehiclesById.set(String(v.id), v);
    }
  }

  const initialCustomers = [...customersById.values()].map((row) =>
    mapDbCustomerRowToCustomer(row)
  );
  const initialVehicles = [...vehiclesById.values()].map((row) =>
    mapDbVehicleRowToVehicle(row)
  );

  return (
    <Suspense fallback={<div className="p-8 text-wraptors-muted text-sm">Loading jobs…</div>}>
      <JobsPageClient
        initialJobs={initialJobs}
        initialCustomers={initialCustomers}
        initialVehicles={initialVehicles}
      />
    </Suspense>
  );
}
