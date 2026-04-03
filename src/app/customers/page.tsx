import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/helpers";
import { mapDbCustomerRowToCustomer } from "@/lib/server-data/hydration-mappers";
import { CustomersPageClient } from "./customers-page-client";

export default async function CustomersPage() {
  await requirePermission("customers.view");
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("*, vehicles(id)")
    .order("created_at", { ascending: false })
    .limit(100);

  const initialCustomers = (data ?? []).map((row) =>
    mapDbCustomerRowToCustomer(row as unknown as Record<string, unknown>)
  );

  return <CustomersPageClient initialCustomers={initialCustomers} />;
}
