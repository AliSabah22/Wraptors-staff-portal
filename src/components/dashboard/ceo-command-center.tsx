"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import {
  cn,
  formatCurrencyShop,
  formatLastUpdated,
  getTimeOfDayGreeting,
  formatDashboardHeadingDate,
  formatDate,
  formatDateRange,
} from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/format";
import { getRangeForPreset, isDateInRange, type DateRange } from "@/lib/date-range";
import { useNotificationsStore } from "@/stores";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { CeoDashboardPayload, CeoSelectedPeriodSummary } from "@/types/ceo-dashboard";

const EMPTY_PERIOD_SUMMARY: CeoSelectedPeriodSummary = {
  active_in_shop: 0,
  jobs_due_in_period: 0,
  pending_quotes: 0,
  jobs_completed: 0,
  quotes_sent: 0,
  new_customers: 0,
  avg_job_value: 0,
  conversion_rate: 0,
};
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import {
  RefreshCw,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Inbox,
  FileWarning,
  ArrowRight,
  Car,
  Calendar,
  FileText,
  DollarSign,
  Target,
  Activity,
} from "lucide-react";

const STALE_MS = 8 * 60 * 60 * 1000;

type LiveJobRow = Record<string, unknown> & {
  id: string;
  status?: string;
  updated_at?: string;
  customers?: { full_name?: string } | null;
  vehicles?: { make?: string; model?: string; year?: number } | null;
  staff_users?: { full_name?: string } | null;
};

function customerLastName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return "—";
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1]! : fullName;
}

function techFirstName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return "";
  return fullName.trim().split(/\s+/)[0] ?? "";
}

function isStale(updatedAt: string | undefined): boolean {
  if (!updatedAt) return true;
  return Date.now() - new Date(updatedAt).getTime() > STALE_MS;
}

function getTimeDisplay(updatedAt: string | undefined): string {
  if (!updatedAt) return "—";
  const hours = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 3600000);
  if (hours < 1) return "Just updated";
  return `${hours}h ago`;
}

function sortLiveJobs(jobs: LiveJobRow[]): LiveJobRow[] {
  const rank = (j: LiveJobRow) => {
    const st = String(j.status ?? "");
    if (st === "ready_for_pickup") return 2;
    if (st === "in_progress") return 3;
    if (st === "quality_check") return 4;
    if (st === "intake") return 5;
    return 6;
  };
  return [...jobs].sort((a, b) => {
    const sa = isStale(String(a.updated_at));
    const sb = isStale(String(b.updated_at));
    if (sa !== sb) return sa ? -1 : 1;
    if (sa && sb) {
      const ta = new Date(String(a.updated_at)).getTime();
      const tb = new Date(String(b.updated_at)).getTime();
      return ta - tb;
    }
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return new Date(String(a.updated_at)).getTime() - new Date(String(b.updated_at)).getTime();
  });
}

function statusDotClass(status: string, stale: boolean): string {
  if (stale) return "bg-red-500";
  switch (status) {
    case "intake":
      return "bg-neutral-500";
    case "in_progress":
      return "bg-blue-500";
    case "quality_check":
      return "bg-amber-500";
    case "ready_for_pickup":
      return "bg-emerald-500";
    default:
      return "bg-neutral-500";
  }
}

function statusBadgeVariant(
  status: string
): "default" | "secondary" | "outline" | "success" | "warning" | "destructive" {
  switch (status) {
    case "ready_for_pickup":
      return "success";
    case "quality_check":
      return "warning";
    case "in_progress":
      return "default";
    default:
      return "outline";
  }
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

function getDaysOverdue(dueDate: string | null): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate + "T12:00:00.000Z").getTime();
  const days = Math.floor((Date.now() - due) / 86400000);
  return days > 0 ? days : 0;
}

function truncateServices(services: string[] | null, maxLen: number): string {
  if (!services?.length) return "—";
  const s = services.join(", ");
  return s.length <= maxLen ? s : `${s.slice(0, maxLen - 1)}…`;
}

function TileSkeleton() {
  return (
    <div className="rounded-xl border border-wraptors-border bg-wraptors-surface p-4">
      <div className="h-3 w-20 animate-pulse rounded bg-wraptors-border/60" />
      <div className="mt-3 h-8 w-24 animate-pulse rounded bg-wraptors-border/60" />
      <div className="mt-2 h-3 w-32 animate-pulse rounded bg-wraptors-border/40" />
    </div>
  );
}

export function CEOCommandCenter() {
  const { user } = useCurrentUser();
  const allNotifications = useNotificationsStore((s) => s.items) ?? [];
  const [data, setData] = useState<CeoDashboardPayload | null>(null);
  const [liveJobs, setLiveJobs] = useState<LiveJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  const [headerPulse, setHeaderPulse] = useState(false);
  const [techPeriod, setTechPeriod] = useState<"week" | "month">("week");
  const [dateRange, setDateRange] = useState<DateRange>(() => getRangeForPreset("last_30"));

  const applyPayload = useCallback((payload: CeoDashboardPayload) => {
    setData(payload);
    setLiveJobs((payload.live_jobs ?? []) as LiveJobRow[]);
    setLastUpdated(new Date());
  }, []);

  const fromDay = format(dateRange.from, "yyyy-MM-dd");
  const toDay = format(dateRange.to, "yyyy-MM-dd");

  const loadCeo = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/dashboard/ceo?period=${techPeriod}&from_day=${encodeURIComponent(fromDay)}&to_day=${encodeURIComponent(toDay)}`,
        {
        credentials: "include",
        }
      );
      const json = (await res.json()) as {
        success?: boolean;
        data?: CeoDashboardPayload;
        error?: string;
      };
      if (!res.ok || json.success === false) {
        setError(json.error ?? "Could not load dashboard");
        return;
      }
      if (json.data) {
        applyPayload(json.data);
        setError(null);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [applyPayload, techPeriod, fromDay, toDay]);

  const loadLiveJobsOnly = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/live-jobs", { credentials: "include" });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { jobs?: LiveJobRow[] };
      };
      if (json.success && json.data?.jobs) {
        setLiveJobs(json.data.jobs);
        setHeaderPulse(true);
        window.setTimeout(() => setHeaderPulse(false), 1200);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadCeo();
  }, [loadCeo]);

  useEffect(() => {
    const id = setInterval(() => void loadCeo(), 60_000);
    return () => clearInterval(id);
  }, [loadCeo]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("ceo-dashboard-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => {
          void loadLiveJobsOnly();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadLiveJobsOnly]);

  const sortedLive = useMemo(() => sortLiveJobs(liveJobs), [liveJobs]);
  const livePreview = sortedLive.slice(0, 6);
  const liveMore = Math.max(0, sortedLive.length - 6);

  const recentActivity = useMemo(
    () =>
      allNotifications
        .filter((n) => n.userId === user?.id && isDateInRange(n.createdAt, dateRange))
        .slice(0, 5),
    [allNotifications, user?.id, dateRange]
  );

  const t = data?.tiles;
  const todayDiff = (t?.revenue_today ?? 0) - (t?.revenue_yesterday ?? 0);
  const weekPct = t?.week_vs_prev_week_percent;

  if (loading && !data) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 animate-pulse rounded bg-wraptors-border/60" />
            <div className="h-4 w-96 max-w-full animate-pulse rounded bg-wraptors-border/40" />
          </div>
          <div className="h-9 w-40 animate-pulse rounded-full bg-wraptors-border/60" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <TileSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <TileSkeleton key={`p-${i}`} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[320px] animate-pulse rounded-xl border border-wraptors-border bg-wraptors-surface" />
          <div className="h-[320px] animate-pulse rounded-xl border border-wraptors-border bg-wraptors-surface" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3 rounded-xl border border-wraptors-border bg-wraptors-surface p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-wraptors-border/40" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-xl border border-wraptors-border bg-wraptors-surface" />
            <div className="h-40 animate-pulse rounded-xl border border-wraptors-border bg-wraptors-surface" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription className="text-red-400">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => void loadCeo()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!t || !data) return null;

  const rawPeriod = data.selected_period;
  const sp = {
    from_day: rawPeriod?.from_day ?? "",
    to_day: rawPeriod?.to_day ?? "",
    paid_revenue: Number(rawPeriod?.paid_revenue ?? 0),
    revenue_by_service: rawPeriod?.revenue_by_service ?? [],
    job_status_pie: rawPeriod?.job_status_pie ?? [],
    summary: { ...EMPTY_PERIOD_SUMMARY, ...rawPeriod?.summary },
  };

  const newQuotesList = data.new_quotes ?? [];
  const newQuotesMore = data.new_quotes_more ?? 0;
  const outstandingInvoicesList = data.outstanding_invoices ?? [];
  const techniciansData = data.technicians ?? { period: "week" as const, technicians: [] };
  const technicianRows = techniciansData.technicians ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {getTimeOfDayGreeting()}
          </h1>
          <p className="mt-1 text-wraptors-muted">
            {formatDashboardHeadingDate()} — here&apos;s your shop at a glance
          </p>
        </div>
        <div className="flex w-full max-w-full flex-col gap-3 lg:w-auto lg:items-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {lastUpdated && (
              <span
                className="rounded-full border border-wraptors-border bg-wraptors-charcoal/50 px-3 py-1.5 text-xs text-wraptors-muted"
                data-relative-tick={tick}
              >
                {formatLastUpdated(lastUpdated)}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 border-wraptors-border"
              onClick={() => void loadCeo()}
              aria-label="Refresh dashboard"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            trailing={
              <Button asChild size="sm" className="gap-1.5 shrink-0">
                <Link href="/jobs">
                  View all jobs <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            }
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-amber-400">
          {error} — showing last good data.
        </p>
      )}

      {/* Row 1 — financial + urgent */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/invoices"
          className="group rounded-xl border border-wraptors-border bg-wraptors-surface p-4 shadow-sm transition-colors hover:border-wraptors-gold/40"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-wraptors-muted">
            Revenue today
          </p>
          <p className="mt-2 text-2xl font-bold text-wraptors-gold">
            {formatCurrencyShop(t.revenue_today)}
          </p>
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              todayDiff >= 0 ? "text-emerald-400" : "text-red-400"
            )}
          >
            {todayDiff >= 0 ? "+" : ""}
            {formatCurrencyShop(todayDiff)} vs yesterday
          </p>
        </Link>
        <Link
          href="/invoices"
          className="group rounded-xl border border-wraptors-border bg-wraptors-surface p-4 shadow-sm transition-colors hover:border-wraptors-gold/40"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-wraptors-muted">
            Revenue this week
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatCurrencyShop(t.revenue_this_week)}
          </p>
          {weekPct != null && (
            <p
              className={cn(
                "mt-1 flex items-center gap-1 text-xs font-medium",
                weekPct >= 0 ? "text-emerald-400" : "text-red-400"
              )}
            >
              {weekPct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {weekPct >= 0 ? "+" : ""}
              {weekPct}% vs last week
            </p>
          )}
          {weekPct == null && (
            <p className="mt-1 text-xs text-wraptors-muted">vs prior 7 days</p>
          )}
        </Link>
        <Link
          href="/jobs"
          className="group rounded-xl border border-wraptors-border bg-wraptors-surface p-4 shadow-sm transition-colors hover:border-wraptors-gold/40"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-wraptors-muted">
            Active jobs
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{t.active_jobs}</p>
          <p
            className={cn(
              "mt-1 text-xs",
              t.jobs_due_today > 0 ? "font-medium text-amber-400" : "text-wraptors-muted"
            )}
          >
            {t.jobs_due_today} due today
          </p>
        </Link>
        <Link
          href="/jobs?filter=overdue"
          className={cn(
            "group rounded-xl border bg-wraptors-surface p-4 shadow-sm transition-colors hover:border-wraptors-gold/40",
            t.jobs_overdue > 0
              ? "border-l-4 border-l-red-500 border-y border-r border-wraptors-border"
              : "border border-wraptors-border"
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-wraptors-muted">
            Overdue jobs
          </p>
          <p
            className={cn(
              "mt-2 text-2xl font-bold",
              t.jobs_overdue > 0 ? "text-red-400" : "text-white"
            )}
          >
            {t.jobs_overdue}
          </p>
          <p className="mt-1 text-xs text-wraptors-muted">Past end date</p>
        </Link>
      </div>

      {/* Row 2 — operational */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/quote-requests?status=new"
          className={cn(
            "group rounded-xl border bg-wraptors-surface p-4 shadow-sm transition-colors hover:border-wraptors-gold/40",
            t.quote_requests_new > 0
              ? "border-l-4 border-l-amber-500 border-y border-r border-wraptors-border"
              : "border border-wraptors-border"
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-wraptors-muted">
            New quote requests
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{t.quote_requests_new}</p>
          <p className="mt-1 text-xs text-wraptors-muted">Awaiting response</p>
        </Link>
        <Link
          href="/jobs?status=ready_for_pickup"
          className="group rounded-xl border border-wraptors-border bg-wraptors-surface p-4 shadow-sm transition-colors hover:border-wraptors-gold/40"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-wraptors-muted">
            Ready for pickup
          </p>
          <p
            className={cn(
              "mt-2 text-2xl font-bold",
              t.ready_for_pickup > 0 ? "text-emerald-400" : "text-white"
            )}
          >
            {t.ready_for_pickup}
          </p>
          <p className="mt-1 text-xs text-wraptors-muted">
            {t.ready_for_pickup === 0
              ? "None waiting"
              : t.ready_pickup_all_notified
                ? "All customers notified"
                : "Customer not notified"}
          </p>
        </Link>
        <Link
          href="/invoices?status=unpaid"
          className={cn(
            "group rounded-xl border bg-wraptors-surface p-4 shadow-sm transition-colors hover:border-wraptors-gold/40",
            t.outstanding_invoice_total > 0
              ? "border-l-4 border-l-amber-500 border-y border-r border-wraptors-border"
              : "border border-wraptors-border"
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-wraptors-muted">
            Outstanding invoices
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatCurrencyShop(t.outstanding_invoice_total)}
          </p>
          <p className="mt-1 text-xs text-wraptors-muted">
            {t.outstanding_invoice_count} unpaid
          </p>
        </Link>
        <Link
          href="/customers"
          className="group rounded-xl border border-wraptors-border bg-wraptors-surface p-4 shadow-sm transition-colors hover:border-wraptors-gold/40"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-wraptors-muted">
            Warranties expiring
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{t.warranties_expiring_30d}</p>
          <p className="mt-1 text-xs text-wraptors-muted">
            {t.warranties_expiring_30d === 0
              ? "No warranties expiring"
              : "Within 30 days"}
          </p>
        </Link>
      </div>

      {/* Selected period — KPIs, distribution, activity (follows date range above) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Selected period</h2>
          <p className="text-sm text-wraptors-muted">
            Jobs with due date or created date in{" "}
            <span className="text-wraptors-muted-light">{formatDateRange(dateRange.from, dateRange.to)}</span>
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-wraptors-muted">Active in shop</CardTitle>
              <Car className="h-4 w-4 text-wraptors-gold" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-wraptors-gold">{sp.summary.active_in_shop}</p>
              <p className="text-xs text-wraptors-muted">in period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-wraptors-muted">Due in period</CardTitle>
              <Calendar className="h-4 w-4 text-wraptors-gold" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{sp.summary.jobs_due_in_period}</p>
              <p className="text-xs text-wraptors-muted">by end date</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-wraptors-muted">Pending quotes</CardTitle>
              <FileText className="h-4 w-4 text-wraptors-gold" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{sp.summary.pending_quotes}</p>
              <p className="text-xs text-wraptors-muted">new / contacted</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-wraptors-muted">Paid revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-wraptors-gold" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-wraptors-gold">{formatCurrencyShop(sp.paid_revenue)}</p>
              <p className="text-xs text-wraptors-muted">invoices paid</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-wraptors-muted">Avg job value</CardTitle>
              <TrendingUp className="h-4 w-4 text-wraptors-gold" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {formatCurrencyShop(sp.summary.avg_job_value)}
              </p>
              <p className="text-xs text-wraptors-muted">completed in period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-wraptors-muted">Quote conversion</CardTitle>
              <Target className="h-4 w-4 text-wraptors-gold" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{sp.summary.conversion_rate}%</p>
              <p className="text-xs text-wraptors-muted">quoted+ in period</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-wraptors-border">
            <CardHeader>
              <CardTitle>Job status distribution</CardTitle>
              <CardDescription>Jobs tied to the selected range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] flex items-center justify-center">
                {sp.job_status_pie.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sp.job_status_pie}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {sp.job_status_pie.map((entry, i) => (
                          <Cell key={`${entry.name}-${i}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #2a2a2a",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-wraptors-muted text-sm">No jobs in selected date range</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border-wraptors-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Latest updates</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/notifications" className="gap-1">
                  View all <Activity className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="py-8 text-center text-sm text-wraptors-muted">No activity in this range</p>
              ) : (
                <ul className="space-y-4">
                  {recentActivity.map((n) => (
                    <li
                      key={n.id}
                      className="flex items-start gap-3 rounded-lg border border-wraptors-border/50 p-3 transition-colors hover:border-wraptors-gold/30"
                    >
                      <div
                        className={cn(
                          "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                          n.read ? "bg-wraptors-muted" : "bg-wraptors-gold"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-wraptors-muted mt-0.5">{n.message}</p>
                        <p className="text-xs text-wraptors-muted mt-1">{formatDate(n.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live board + right column */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          className={cn(
            "lg:col-span-2 border-wraptors-border",
            headerPulse && "ring-1 ring-wraptors-gold/50"
          )}
        >
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle>Live job board</CardTitle>
              <CardDescription>Active jobs on the floor</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-wraptors-gold" asChild>
              <Link href="/dashboard/live">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {livePreview.length === 0 ? (
              <div className="py-10 text-center text-wraptors-muted">
                <Inbox className="mx-auto mb-2 h-10 w-10 opacity-40" />
                <p>No active jobs — shop is clear</p>
              </div>
            ) : (
              <>
                {livePreview.map((j) => {
                  const st = String(j.status ?? "intake");
                  const stale = isStale(j.updated_at ? String(j.updated_at) : undefined);
                  const v = j.vehicles;
                  const veh = v
                    ? `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim()
                    : "Vehicle";
                  const cust = customerLastName(j.customers?.full_name);
                  const tech = techFirstName(j.staff_users?.full_name);
                  return (
                    <Link
                      key={j.id}
                      href={`/jobs/${j.id}`}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-wraptors-border/60 bg-wraptors-charcoal/20 px-3 py-2.5 transition-colors hover:border-wraptors-gold/30"
                    >
                      <span
                        className={cn("h-2.5 w-2.5 shrink-0 rounded-full", statusDotClass(st, stale))}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{veh}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <Badge variant={statusBadgeVariant(st)} className="text-[10px]">
                            {formatStatusLabel(st)}
                          </Badge>
                          {!tech ? (
                            <span className="text-xs text-red-400/90">Unassigned</span>
                          ) : (
                            <span className="text-xs text-wraptors-muted">{tech}</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-wraptors-muted">{cust}</p>
                        {stale ? (
                          <p className="text-xs font-medium text-red-400">
                            No update · {getTimeDisplay(j.updated_at ? String(j.updated_at) : undefined)}
                          </p>
                        ) : (
                          <p className="text-xs text-wraptors-muted">
                            {getTimeDisplay(j.updated_at ? String(j.updated_at) : undefined)}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
                {liveMore > 0 && (
                  <p className="pt-1 text-center text-sm text-wraptors-gold">
                    <Link href="/dashboard/live" className="hover:underline">
                      and {liveMore} more active jobs
                    </Link>
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="border-wraptors-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">New quote requests</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-wraptors-gold" asChild>
                <Link href="/quote-requests?status=new">
                  Respond <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {newQuotesList.length === 0 ? (
                <p className="py-6 text-center text-sm text-wraptors-muted">No new requests</p>
              ) : (
                <>
                  {newQuotesList.map((q) => (
                    <div
                      key={q.id}
                      className="border-b border-wraptors-border/40 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between gap-2">
                        <p className="font-medium text-white">{q.customer_name}</p>
                        <span className="shrink-0 text-[11px] text-wraptors-muted">
                          {formatRelativeTime(q.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-wraptors-muted">
                        {truncateServices(q.services_requested, 48)}
                      </p>
                    </div>
                  ))}
                  {newQuotesMore > 0 && (
                    <Link
                      href="/quote-requests?status=new"
                      className="block text-center text-xs text-wraptors-gold hover:underline"
                    >
                      and {newQuotesMore} more
                    </Link>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-wraptors-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Outstanding invoices</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-wraptors-gold" asChild>
                <Link href="/invoices?status=unpaid">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {outstandingInvoicesList.length === 0 ? (
                <div className="py-6 text-center text-wraptors-muted">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500/80" />
                  <p className="text-sm text-emerald-400/90">All invoices paid</p>
                </div>
              ) : (
                outstandingInvoicesList.map((inv) => {
                  const overdueDays = getDaysOverdue(inv.due_date);
                  return (
                    <div
                      key={inv.id}
                      className="flex items-start justify-between gap-2 border-b border-wraptors-border/40 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-white">
                          {inv.customer_name ?? "Customer"}
                        </p>
                        {overdueDays > 0 ? (
                          <Badge variant="destructive" className="mt-1 text-[10px]">
                            {overdueDays}d overdue
                          </Badge>
                        ) : (
                          <span className="mt-1 inline-block text-[10px] text-wraptors-muted">
                            Sent
                          </span>
                        )}
                      </div>
                      <p className="shrink-0 font-semibold text-white">
                        {formatCurrencyShop(inv.total)}
                      </p>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom: technicians, revenue by service, month summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-wraptors-border">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle className="text-base">Technician performance</CardTitle>
              <CardDescription>
                Completed jobs ({techniciansData.period === "week" ? "7 days" : "30 days"})
              </CardDescription>
            </div>
            <div className="flex rounded-md border border-wraptors-border p-0.5">
              <button
                type="button"
                onClick={() => setTechPeriod("week")}
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium transition-colors",
                  techPeriod === "week"
                    ? "bg-wraptors-gold/20 text-wraptors-gold"
                    : "text-wraptors-muted hover:text-white"
                )}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setTechPeriod("month")}
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium transition-colors",
                  techPeriod === "month"
                    ? "bg-wraptors-gold/20 text-wraptors-gold"
                    : "text-wraptors-muted hover:text-white"
                )}
              >
                Month
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {technicianRows.length === 0 ? (
              <p className="py-4 text-center text-sm text-wraptors-muted">
                No technicians added yet
              </p>
            ) : (
              (() => {
                const maxJ = Math.max(
                  1,
                  ...technicianRows.map((x) => x.completed_jobs)
                );
                return technicianRows.map((tech) => (
                  <div key={tech.id} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="truncate font-medium text-white">{tech.name}</span>
                      <span className="shrink-0 text-wraptors-muted">{tech.completed_jobs}</span>
                    </div>
                    <Progress
                      value={Math.min((tech.completed_jobs / maxJ) * 100, 100)}
                      className="h-2 [&>div]:bg-wraptors-gold"
                    />
                  </div>
                ));
              })()
            )}
          </CardContent>
        </Card>

        <Card className="border-wraptors-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue by service</CardTitle>
            <CardDescription>Completed jobs in selected period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sp.revenue_by_service.length === 0 ? (
              <div className="py-6 text-center text-wraptors-muted">
                <FileWarning className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p className="text-sm">No completed jobs in this range</p>
              </div>
            ) : (
              (() => {
                const maxR = Math.max(1, ...sp.revenue_by_service.map((x) => x.revenue));
                return sp.revenue_by_service.map((row) => (
                  <div key={row.name} className="space-y-1.5">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="truncate text-white">{row.name}</span>
                      <span className="shrink-0 font-medium text-wraptors-gold">
                        {formatCurrencyShop(row.revenue)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min((row.revenue / maxR) * 100, 100)}
                      className="h-2 [&>div]:bg-wraptors-gold"
                    />
                  </div>
                ));
              })()
            )}
          </CardContent>
        </Card>

        <Card className="border-wraptors-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Period summary</CardTitle>
            <CardDescription>Paid invoices + throughput for selected range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-wraptors-muted">Paid revenue</p>
              <p className="text-3xl font-bold text-wraptors-gold">
                {formatCurrencyShop(sp.paid_revenue)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-wraptors-border/60 bg-wraptors-charcoal/20 p-3">
                <p className="text-wraptors-muted">Jobs completed</p>
                <p className="text-lg font-semibold text-white">
                  {sp.summary.jobs_completed}
                </p>
              </div>
              <div className="rounded-lg border border-wraptors-border/60 bg-wraptors-charcoal/20 p-3">
                <p className="text-wraptors-muted">Quotes sent</p>
                <p className="text-lg font-semibold text-white">
                  {sp.summary.quotes_sent}
                </p>
                <p className="text-[10px] text-wraptors-muted">Quote requests → quoted</p>
              </div>
              <div className="rounded-lg border border-wraptors-border/60 bg-wraptors-charcoal/20 p-3">
                <p className="text-wraptors-muted">New customers</p>
                <p className="text-lg font-semibold text-white">
                  {sp.summary.new_customers}
                </p>
              </div>
              <div className="rounded-lg border border-wraptors-border/60 bg-wraptors-charcoal/20 p-3">
                <p className="text-wraptors-muted">Avg job value</p>
                <p className="text-lg font-semibold text-white">
                  {formatCurrencyShop(sp.summary.avg_job_value)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
