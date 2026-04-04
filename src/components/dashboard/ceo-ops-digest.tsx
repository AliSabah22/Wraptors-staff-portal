"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  ClipboardList,
  FileText,
  Package,
  Receipt,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type DigestPayload = {
  jobs_due_today: number;
  jobs_overdue: number;
  jobs_in_progress: number;
  jobs_ready_for_pickup: number;
  new_quote_requests_24h: number;
  outstanding_invoice_count: number;
  outstanding_invoice_total: number;
  invoices_overdue_30d: number;
  warranties_expiring_soon: number;
  today_utc: string;
};

function Tile({
  href,
  label,
  value,
  subValue,
  icon: Icon,
  pulse,
  valueClassName,
}: {
  href: string;
  label: string;
  value: string | number;
  subValue?: string;
  icon: typeof Calendar;
  pulse?: boolean;
  valueClassName?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col justify-between rounded-lg border border-wraptors-border bg-wraptors-charcoal/40 p-4 transition-colors hover:border-wraptors-gold/40 hover:bg-wraptors-surface-hover/50",
        pulse && "animate-pulse border-wraptors-gold/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Icon className="h-4 w-4 shrink-0 text-wraptors-gold/80" />
        <ArrowRight className="h-4 w-4 shrink-0 text-wraptors-muted opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="mt-3">
        <p className={cn("text-[28px] font-bold leading-none text-white", valueClassName)}>{value}</p>
        <p className="mt-1 text-[11px] uppercase tracking-wide text-wraptors-muted">{label}</p>
        {subValue && <p className="mt-0.5 text-xs text-wraptors-muted">{subValue}</p>}
      </div>
    </Link>
  );
}

export function CEOOpsDigest() {
  const [data, setData] = useState<DigestPayload | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/digest", { credentials: "include" });
      const json = (await res.json()) as { success?: boolean; data?: DigestPayload; error?: string };
      if (!res.ok || json.success === false) {
        setError(json.error ?? "Could not load digest");
        return;
      }
      if (json.data) {
        setData(json.data);
        setUpdatedAt(new Date());
        setError(null);
      }
    } catch {
      setError("Network error");
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, [load]);

  const pulseAttention =
    (data?.jobs_overdue ?? 0) > 0 || (data?.new_quote_requests_24h ?? 0) > 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-wraptors-border border-l-4 border-l-wraptors-gold bg-wraptors-surface/80 p-5 shadow-sm"
      )}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Today&apos;s Operations</h2>
          <p className="text-xs text-wraptors-muted">
            {updatedAt
              ? `Updated ${updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Loading…"}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="text-wraptors-gold" onClick={() => void load()}>
          Refresh
        </Button>
      </div>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {data && (
        <div
          className={cn(
            "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            pulseAttention && "[&>a:first-child]:animate-none"
          )}
        >
          <Tile
            href="/jobs?filter=due_today"
            label="Due today"
            value={data.jobs_due_today}
            icon={Calendar}
          />
          <Tile
            href="/jobs?filter=overdue"
            label="Overdue"
            value={data.jobs_overdue}
            icon={AlertTriangle}
            pulse={data.jobs_overdue > 0}
            valueClassName={data.jobs_overdue > 0 ? "text-red-400" : "text-wraptors-muted"}
          />
          <Tile
            href="/jobs?status=in_progress"
            label="In progress"
            value={data.jobs_in_progress}
            icon={ClipboardList}
          />
          <Tile
            href="/jobs?status=ready_for_pickup"
            label="Ready for pickup"
            value={data.jobs_ready_for_pickup}
            icon={Package}
            valueClassName={data.jobs_ready_for_pickup > 0 ? "text-emerald-400" : undefined}
          />
          <Tile
            href="/quote-requests?status=new"
            label="New quotes (24h)"
            value={data.new_quote_requests_24h}
            icon={FileText}
            pulse={data.new_quote_requests_24h > 0}
          />
          <Tile
            href="/invoices?status=unpaid"
            label="Outstanding invoices"
            value={formatCurrency(data.outstanding_invoice_total)}
            subValue={`${data.outstanding_invoice_count} open`}
            icon={Receipt}
          />
          <Tile
            href="/jobs"
            label="Warranties expiring (30d)"
            value={data.warranties_expiring_soon}
            icon={Shield}
            valueClassName={data.warranties_expiring_soon > 0 ? "text-wraptors-gold" : undefined}
          />
        </div>
      )}

      {data && data.outstanding_invoice_count > 0 && (
        <div className="mt-4 rounded-lg border border-wraptors-gold/40 border-l-4 border-l-wraptors-gold bg-wraptors-charcoal/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Receipt className="h-5 w-5 shrink-0 text-wraptors-gold" />
              <div>
                <p className="font-medium text-white">
                  {data.outstanding_invoice_count} invoice{data.outstanding_invoice_count !== 1 ? "s" : ""}{" "}
                  outstanding — {formatCurrency(data.outstanding_invoice_total)}
                </p>
                {data.invoices_overdue_30d > 0 && (
                  <p className="mt-0.5 text-sm text-wraptors-muted">
                    {data.invoices_overdue_30d} sent more than 30 days ago
                  </p>
                )}
              </div>
            </div>
            <Button asChild size="sm" className="gap-1.5 shrink-0">
              <Link href="/invoices?status=unpaid">
                View invoices <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
