import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/role-permissions";
import {
  buildServiceNameToIdMap,
  mapDbCustomerRowToCustomer,
  mapDbJobRowToServiceJobWithMedia,
  mapDbVehicleRowToVehicle,
} from "@/lib/server-data/hydration-mappers";
import { JobDetailPageClient } from "./job-detail-page-client";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const { data: row, error } = await supabase
    .from("jobs")
    .select(
      `
      *,
      customers(id, full_name, email, phone, notes, membership_status, created_at, updated_at),
      vehicles(id, customer_id, make, model, year, color, vin, license_plate, created_at, updated_at),
      staff_users!technician_id(id, full_name, role, avatar_url),
      job_media(*),
      quote_requests(id, services_requested, estimated_value)
    `
    )
    .eq("id", id)
    .single();

  if (error || !row) {
    notFound();
  }

  const r = row as unknown as Record<string, unknown>;
  const canViewAll =
    hasPermission(user.role, "jobs.view_operational") || hasPermission(user.role, "jobs.view_all");
  if (!canViewAll && String(r.technician_id ?? "") !== user.id) {
    notFound();
  }

  const { job, mediaItems } = mapDbJobRowToServiceJobWithMedia(r, serviceNameToId);

  const cust = r.customers as Record<string, unknown> | null | undefined;
  const initialCustomer =
    cust && cust.id != null
      ? mapDbCustomerRowToCustomer({ ...cust, vehicles: [] })
      : null;

  const veh = r.vehicles as Record<string, unknown> | null | undefined;
  const initialVehicle = veh && veh.id != null ? mapDbVehicleRowToVehicle(veh) : null;

  return (
    <JobDetailPageClient
      jobId={id}
      initialJob={job}
      initialCustomer={initialCustomer}
      initialVehicle={initialVehicle}
      initialMediaItems={mediaItems}
    />
  );
}
