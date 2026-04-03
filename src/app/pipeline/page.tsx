import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/helpers";
import { pipelineBoardToColumnsAndLeads } from "@/lib/server-data/hydration-mappers";
import { PipelinePageClient } from "./pipeline-page-client";

export default async function PipelinePage() {
  await requirePermission("pipeline.view");
  const supabase = await createClient();

  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true });

  const { data: items } = await supabase
    .from("pipeline_items")
    .select(
      `
      *,
      quote_requests(
        id, customer_id, vehicle_id, customer_name, customer_email, customer_phone,
        services_requested, estimated_value, source, status, notes, created_at, updated_at,
        customers(full_name, membership_status),
        vehicles(make, model, year)
      ),
      jobs(
        id, customer_id, vehicle_id, status, price, start_date, services, created_at, updated_at,
        customers(full_name, membership_status),
        vehicles(make, model, year)
      )
    `
    )
    .order("position", { ascending: true });

  const { columns, leads } = pipelineBoardToColumnsAndLeads(
    (stages ?? []) as unknown as Record<string, unknown>[],
    (items ?? []) as unknown as Record<string, unknown>[]
  );

  return <PipelinePageClient initialColumns={columns} initialLeads={leads} />;
}
