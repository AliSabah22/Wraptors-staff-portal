"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { ComingSoonCard } from "@/components/ui/coming-soon-card";

const statusVariant: Record<string, "default" | "secondary" | "success" | "destructive"> = {
  draft: "secondary",
  sent: "default",
  paid: "success",
  overdue: "destructive",
  cancelled: "secondary",
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

function effectiveStatus(inv: InvoiceRow): string {
  if (inv.status === "sent" && inv.due_date) {
    const due = new Date(inv.due_date + "T12:00:00.000Z").getTime();
    if (due < Date.now()) return "overdue";
  }
  return inv.status;
}

const TAB_LINKS: { href: string; label: string; param: string | null }[] = [
  { href: "/invoices", label: "All", param: null },
  { href: "/invoices?status=draft", label: "Draft", param: "draft" },
  { href: "/invoices?status=sent", label: "Sent", param: "sent" },
  { href: "/invoices?status=paid", label: "Paid", param: "paid" },
  { href: "/invoices?status=overdue", label: "Overdue", param: "overdue" },
  { href: "/invoices?status=unpaid", label: "Unpaid", param: "unpaid" },
];

export default function InvoicesPageClient() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const tab = searchParams.get("status");
  const { hasPermission } = usePermissions();

  const load = useCallback(() => {
    return fetch("/api/invoices")
      .then((r) => r.json())
      .then((body: { success?: boolean; data?: { invoices?: InvoiceRow[] } }) => {
        if (!body?.success || !body.data?.invoices) return;
        setInvoices(body.data.invoices);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().finally(() => {
      if (!cancelled) setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const patchInvoice = async (id: string, body: Record<string, unknown>) => {
    setActionError(null);
    setActionId(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { success?: boolean; error?: string; data?: InvoiceRow };
      if (!json?.success || !json.data) {
        setActionError(json?.error ?? "Update failed");
        return;
      }
      setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...json.data! } : i)));
    } catch {
      setActionError("Network error");
    } finally {
      setActionId(null);
    }
  };

  const filtered = useMemo(() => {
    if (tab === "unpaid") {
      return invoices.filter((i) => i.status === "sent" || i.status === "overdue");
    }
    if (tab === "overdue") {
      return invoices.filter((i) => effectiveStatus(i) === "overdue");
    }
    if (tab && ["draft", "sent", "paid", "cancelled"].includes(tab)) {
      return invoices.filter((i) => i.status === tab);
    }
    return invoices;
  }, [invoices, tab]);

  const hasFilter = Boolean(tab);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-wraptors-muted mt-0.5">
            {hasFilter ? `${filtered.length} shown` : "Job invoices"}
          </p>
        </div>
        <p className="text-xs text-wraptors-muted max-w-xs text-right">
          Create invoices from a completed job using{" "}
          <span className="text-wraptors-gold/90">Generate invoice</span> on the job detail page.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TAB_LINKS.map((t) => {
          const active =
            (t.param === null && !tab) || t.param === tab;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                active
                  ? "border-wraptors-gold/60 bg-wraptors-gold/10 text-wraptors-gold"
                  : "border-wraptors-border text-wraptors-muted hover:border-wraptors-gold/40"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {actionError && (
        <p className="text-sm text-red-400" role="alert">
          {actionError}
        </p>
      )}

      {loaded && invoices.length === 0 ? (
        <Card className="border-wraptors-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-wraptors-gold/10 text-wraptors-gold mb-4">
              <Receipt className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-white">No invoices yet</h3>
            <p className="text-sm text-wraptors-muted mt-1 max-w-sm">
              Invoices from Supabase will appear here when they are created from completed jobs.
            </p>
          </CardContent>
        </Card>
      ) : loaded && filtered.length === 0 ? (
        <Card className="border-wraptors-border border-dashed">
          <CardContent className="py-12 text-center text-wraptors-muted text-sm">
            No invoices match this filter.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-wraptors-border bg-wraptors-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-wraptors-border bg-wraptors-charcoal/50">
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Customer</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Invoice #</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Job</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Amount</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Tax</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Total</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Status</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Due</th>
                {hasPermission("invoices.manage") && (
                  <th className="text-left font-medium text-wraptors-muted px-6 py-4">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const customerName = inv.customers?.full_name ?? "—";
                const eff = effectiveStatus(inv);
                const busy = actionId === inv.id;
                return (
                  <tr
                    key={inv.id}
                    className="border-b border-wraptors-border/50 hover:bg-wraptors-surface-hover/50"
                  >
                    <td className="px-6 py-4 font-medium">{customerName}</td>
                    <td className="px-6 py-4 text-wraptors-muted font-mono text-xs">
                      {inv.invoice_number}
                    </td>
                    <td className="px-6 py-4 text-wraptors-muted">
                      <Link
                        href={`/jobs/${inv.job_id}`}
                        className="hover:text-wraptors-gold underline-offset-2 hover:underline"
                      >
                        Job …{inv.job_id.slice(-4)}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{formatCurrency(inv.subtotal)}</td>
                    <td className="px-6 py-4 text-wraptors-muted">{formatCurrency(inv.tax)}</td>
                    <td className="px-6 py-4 text-wraptors-gold font-medium">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant[eff] ?? "secondary"}>{eff}</Badge>
                    </td>
                    <td className="px-6 py-4 text-wraptors-muted">
                      {inv.due_date ? formatDate(inv.due_date) : "—"}
                    </td>
                    {hasPermission("invoices.manage") && (
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {inv.status === "draft" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8"
                              disabled={busy}
                              onClick={() => patchInvoice(inv.id, { status: "sent" })}
                            >
                              Mark sent
                            </Button>
                          )}
                          {(inv.status === "sent" || inv.status === "overdue" || eff === "overdue") &&
                            inv.status !== "paid" && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 border-emerald-500/40 text-emerald-300"
                                disabled={busy}
                                onClick={() => patchInvoice(inv.id, { status: "paid" })}
                              >
                                Mark paid
                              </Button>
                            )}
                          <p className="text-[11px] text-wraptors-muted border-l border-wraptors-gold/40 pl-2 max-w-[200px] mt-1">
                            Card checkout via Stripe —{" "}
                            <span className="text-wraptors-gold/90">coming soon</span>
                          </p>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasPermission("invoices.view") && invoices.length > 0 && (
        <ComingSoonCard
          title="Stripe payouts & reconciliation"
          description="Automated payout reporting and fee breakdowns for the shop."
          blockedBy="Depends on Stripe Connect and accounting export — not configured yet."
        />
      )}
    </motion.div>
  );
}
