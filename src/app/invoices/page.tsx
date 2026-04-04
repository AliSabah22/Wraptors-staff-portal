import { Suspense } from "react";
import InvoicesPageClient from "./invoices-page-client";

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-wraptors-muted text-sm">Loading invoices…</div>}>
      <InvoicesPageClient />
    </Suspense>
  );
}
