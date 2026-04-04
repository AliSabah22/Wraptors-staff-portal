import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/helpers";
import { mapDbQuoteRowToQuoteRequest } from "@/lib/server-data/hydration-mappers";
import { QuoteRequestsPageClient } from "./quote-requests-page-client";

export default async function QuoteRequestsPage() {
  await requirePermission("quotes.view");
  const supabase = await createClient();
  const { data } = await supabase
    .from("quote_requests")
    .select(
      "*, customers(full_name, membership_status), vehicles(make, model, year)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const initialQuotes = (data ?? []).map((row) =>
    mapDbQuoteRowToQuoteRequest(row as unknown as Record<string, unknown>)
  );

  return (
    <Suspense fallback={<div className="p-8 text-wraptors-muted text-sm">Loading…</div>}>
      <QuoteRequestsPageClient initialQuotes={initialQuotes} />
    </Suspense>
  );
}
