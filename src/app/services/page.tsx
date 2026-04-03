import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/helpers";
import { mapDbServiceRowToService } from "@/lib/server-data/hydration-mappers";
import { ServicesPageClient } from "./services-page-client";

export default async function ServicesPage() {
  await requirePermission("services.view");
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .order("name", { ascending: true });

  const initialServices = (data ?? []).map((row) =>
    mapDbServiceRowToService(row as unknown as Record<string, unknown>)
  );

  return <ServicesPageClient initialServices={initialServices} />;
}
