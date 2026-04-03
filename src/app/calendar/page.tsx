import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/role-permissions";
import {
  buildServiceNameToIdMap,
  mapDbCustomerRowToCustomer,
  mapDbJobRowToServiceJob,
  mapDbServiceRowToService,
  mapDbVehicleRowToVehicle,
} from "@/lib/server-data/hydration-mappers";
import { CalendarPageClient } from "./calendar-page-client";

export default async function CalendarPage() {
  const user = await requireAuth();
  const canUseCalendar =
    hasPermission(user.role, "calendar.view") ||
    hasPermission(user.role, "jobs.view_assigned");
  if (!canUseCalendar) {
    redirect("/dashboard?error=unauthorized");
  }

  const supabase = await createClient();

  const { data: serviceRows } = await supabase.from("services").select("*").order("name", { ascending: true });
  const initialServices = (serviceRows ?? []).map((row) =>
    mapDbServiceRowToService(row as unknown as Record<string, unknown>)
  );
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
  const rows = (jobRows ?? []) as unknown as Record<string, unknown>[];
  const initialJobs = rows.map((r) => mapDbJobRowToServiceJob(r, serviceNameToId));

  const customersById = new Map<string, Record<string, unknown>>();
  const vehiclesById = new Map<string, Record<string, unknown>>();
  for (const r of rows) {
    const c = r.customers as Record<string, unknown> | null | undefined;
    if (c && c.id != null) {
      const id = String(c.id);
      if (!customersById.has(id)) customersById.set(id, { ...c, vehicles: [] });
    }
    const v = r.vehicles as Record<string, unknown> | null | undefined;
    if (v && v.id != null) vehiclesById.set(String(v.id), v);
  }

  const { data: custRows } = await supabase
    .from("customers")
    .select("*, vehicles(id)")
    .order("created_at", { ascending: false })
    .limit(200);

  for (const c of custRows ?? []) {
    const row = c as unknown as Record<string, unknown>;
    const id = String(row.id);
    if (!customersById.has(id)) {
      customersById.set(id, row);
    }
  }

  const initialCustomers = [...customersById.values()].map((row) =>
    mapDbCustomerRowToCustomer(row)
  );
  const initialVehicles = [...vehiclesById.values()].map((row) =>
    mapDbVehicleRowToVehicle(row)
  );

  return (
    <CalendarPageClient
      initialJobs={initialJobs}
      initialCustomers={initialCustomers}
      initialVehicles={initialVehicles}
      initialServices={initialServices}
    />
  );
}
