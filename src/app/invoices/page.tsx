"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";

const statusVariant: Record<string, "default" | "secondary" | "success"> = {
  draft: "secondary",
  sent: "default",
  paid: "success",
};

type InvoiceRow = {
  id: string;
  job_id: string;
  customer_id: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  due_date: string | null;
  invoice_number: string;
  customers: { full_name: string; email: string | null } | null;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/invoices")
      .then((r) => r.json())
      .then(
        (body: {
          success?: boolean;
          data?: { invoices?: InvoiceRow[] };
        }) => {
          if (cancelled || !body?.success || !body.data?.invoices) return;
          setInvoices(body.data.invoices);
        }
      )
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-wraptors-muted mt-0.5">Job invoices</p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled
          title="Create invoice from a completed job will be available in a future update."
        >
          Create invoice
        </Button>
      </div>

      {loaded && invoices.length === 0 ? (
        <Card className="border-wraptors-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-wraptors-gold/10 text-wraptors-gold mb-4">
              <Receipt className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-white">No invoices yet</h3>
            <p className="text-sm text-wraptors-muted mt-1 max-w-sm">
              Invoices from Supabase will appear here when they are created.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-wraptors-border bg-wraptors-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-wraptors-border bg-wraptors-charcoal/50">
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Customer</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Job</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Amount</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Tax</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Total</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Status</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Due</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const customerName = inv.customers?.full_name ?? "—";
                return (
                  <tr
                    key={inv.id}
                    className="border-b border-wraptors-border/50 hover:bg-wraptors-surface-hover/50"
                  >
                    <td className="px-6 py-4 font-medium">{customerName}</td>
                    <td className="px-6 py-4 text-wraptors-muted">Job {inv.job_id.slice(-4)}</td>
                    <td className="px-6 py-4">{formatCurrency(inv.subtotal)}</td>
                    <td className="px-6 py-4 text-wraptors-muted">{formatCurrency(inv.tax)}</td>
                    <td className="px-6 py-4 text-wraptors-gold font-medium">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant[inv.status] ?? "secondary"}>{inv.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-wraptors-muted">
                      {inv.due_date ? formatDate(inv.due_date) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
