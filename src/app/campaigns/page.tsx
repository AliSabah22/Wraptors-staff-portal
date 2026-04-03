import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/helpers";
import { mapDbRowToCampaign } from "@/lib/server-data/hydration-mappers";
import { CampaignsPageClient } from "./campaigns-page-client";

export default async function CampaignsPage() {
  await requirePermission("campaigns.view");
  const supabase = await createClient();
  const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });

  const initialCampaigns = (data ?? []).map((row) =>
    mapDbRowToCampaign(row as unknown as Record<string, unknown>)
  );

  return <CampaignsPageClient initialCampaigns={initialCampaigns} />;
}
