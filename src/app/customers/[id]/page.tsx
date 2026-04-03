import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/helpers";
import {
  buildServiceNameToIdMap,
  mapDbCustomerRowToCustomer,
  mapDbJobRowToServiceJob,
  mapDbVehicleRowToVehicle,
} from "@/lib/server-data/hydration-mappers";
import { CustomerDetailPageClient } from "./customer-detail-page-client";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("customers.view");
  const { id } = await params;
  const supabase = await createClient();

  const { data: custRow, error: custErr } = await supabase
    .from("customers")
    .select("*, vehicles(*)")
    .eq("id", id)
    .single();

  if (custErr || !custRow) {
    notFound();
  }

  const row = custRow as unknown as Record<string, unknown>;
  const vehicleRows = (row.vehicles as Record<string, unknown>[] | null) ?? [];
  const initialCustomer = mapDbCustomerRowToCustomer({
    ...row,
    vehicles: vehicleRows.map((v) => ({ id: v.id })),
  });
  const initialVehicles = vehicleRows.map((v) => mapDbVehicleRowToVehicle(v));

  const { data: serviceRows } = await supabase.from("services").select("id, name").eq("is_active", true);
  const serviceNameToId = buildServiceNameToIdMap(
    (serviceRows ?? []) as unknown as Record<string, unknown>[]
  );

  const { data: jobRows } = await supabase
    .from("jobs")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  const initialJobs = (jobRows ?? []).map((r) =>
    mapDbJobRowToServiceJob(r as unknown as Record<string, unknown>, serviceNameToId)
  );

  return (
    <CustomerDetailPageClient
      customerId={id}
      initialCustomer={initialCustomer}
      initialVehicles={initialVehicles}
      initialJobs={initialJobs}
    />
  );
}
