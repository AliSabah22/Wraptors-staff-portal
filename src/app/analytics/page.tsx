import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/helpers";
import {
  buildServiceNameToIdMap,
  mapDbJobRowToServiceJob,
  mapDbQuoteRowToQuoteRequest,
} from "@/lib/server-data/hydration-mappers";
import { AnalyticsPageClient } from "./analytics-page-client";

export default async function AnalyticsPage() {
  await requirePermission("analytics.view_full");
  const supabase = await createClient();

  const { data: serviceRows } = await supabase.from("services").select("id, name").eq("is_active", true);
  const serviceNameToId = buildServiceNameToIdMap(
    (serviceRows ?? []) as unknown as Record<string, unknown>[]
  );

  const { data: jobRows } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const initialJobs = (jobRows ?? []).map((r) =>
    mapDbJobRowToServiceJob(r as unknown as Record<string, unknown>, serviceNameToId)
  );

  const { data: qRows } = await supabase
    .from("quote_requests")
    .select("*, customers(full_name, membership_status), vehicles(make, model, year)")
    .order("created_at", { ascending: false })
    .limit(200);

  const initialQuotes = (qRows ?? []).map((row) =>
    mapDbQuoteRowToQuoteRequest(row as unknown as Record<string, unknown>)
  );

  return (
    <AnalyticsPageClient initialJobs={initialJobs} initialQuotes={initialQuotes} />
  );
}
