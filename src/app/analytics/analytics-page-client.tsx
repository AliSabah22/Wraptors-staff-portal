"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getRangeForPreset } from "@/lib/date-range";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import { useJobsStore, useQuotesStore } from "@/stores";
import type { QuoteRequest, ServiceJob } from "@/types";
import { useSeedJobsStore } from "@/hooks/useSeedJobsStore";
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  format,
  isWithinInterval,
  isBefore,
} from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { usePermissions } from "@/hooks/usePermissions";

type InvoiceAnalyticsRow = {
  total: number;
  status: string;
  created_at: string | null;
};

function getMonthsInRange(from: Date, to: Date): { monthStart: Date; label: string }[] {
  const months: { monthStart: Date; label: string }[] = [];
  let cursor = startOfMonth(from);
  const end = endOfMonth(to);
  while (isBefore(cursor, end) || cursor.getTime() === end.getTime()) {
    months.push({ monthStart: new Date(cursor), label: format(cursor, "MMM yyyy") });
    cursor = addMonths(cursor, 1);
  }
  return months;
}

export function AnalyticsPageClient({
  initialJobs,
  initialQuotes,
}: {
  initialJobs: ServiceJob[];
  initialQuotes: QuoteRequest[];
}) {
  const setQuotes = useQuotesStore((s) => s.setQuotes);
  const { hasPermission } = usePermissions();
  const [dateRange, setDateRange] = useState(() => getRangeForPreset("last_30"));
  const [invoices, setInvoices] = useState<InvoiceAnalyticsRow[]>([]);
  const [techPeriod, setTechPeriod] = useState<"week" | "month">("week");
  const [techRows, setTechRows] = useState<
    { id: string; name: string; completed_jobs: number; revenue: number; avg_rating: number | null }[]
  >([]);
  const jobs = useJobsStore((s) => s.jobs);
  const quotes = useQuotesStore((s) => s.quotes);

  useEffect(() => {
    setQuotes(initialQuotes);
  }, [initialQuotes, setQuotes]);

  useSeedJobsStore(initialJobs);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/invoices")
      .then((r) => r.json())
      .then(
        (body: {
          success?: boolean;
          data?: { invoices?: Array<{ total: number; status: string; created_at: string | null }> };
        }) => {
          if (cancelled || !body?.success || !body.data?.invoices) return;
          setInvoices(body.data.invoices);
        }
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasPermission("analytics.view_full")) return;
    let cancelled = false;
    fetch(`/api/analytics/technicians?period=${techPeriod}`)
      .then((r) => r.json())
      .then(
        (body: {
          success?: boolean;
          data?: {
            technicians?: {
              id: string;
              name: string;
              completed_jobs: number;
              revenue: number;
              avg_rating: number | null;
            }[];
          };
        }) => {
          if (cancelled || !body?.success || !body.data?.technicians) return;
          setTechRows(body.data.technicians);
        }
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hasPermission, techPeriod]);

  const { revenueData, conversionData } = useMemo(() => {
    const months = getMonthsInRange(dateRange.from, dateRange.to);
    if (months.length === 0) {
      return {
        revenueData: [{ month: "—", revenue: 0, jobs: 0 }],
        conversionData: [{ month: "—", rate: 0 }],
      };
    }

    const revenueData = months.map(({ monthStart, label }) => {
      const monthEnd = endOfMonth(monthStart);
      const invoicesInMonth = invoices.filter((inv) =>
        inv.created_at &&
        isWithinInterval(new Date(inv.created_at), { start: monthStart, end: monthEnd })
      );
      const revenue = invoicesInMonth
        .filter((i) => i.status === "paid" || i.status === "sent")
        .reduce((sum, i) => sum + i.total, 0);
      const jobsInMonth = jobs.filter((j) => {
        const completedAt = j.completedAt ?? j.updatedAt;
        return (
          (j.progress === 100 || !!j.completedAt) &&
          isWithinInterval(new Date(completedAt), { start: monthStart, end: monthEnd })
        );
      });
      return { month: label, revenue: Math.round(revenue / 1000), jobs: jobsInMonth.length };
    });

    const conversionData = months.map(({ monthStart, label }) => {
      const monthEnd = endOfMonth(monthStart);
      const quotesInMonth = quotes.filter((q) =>
        isWithinInterval(new Date(q.createdAt), { start: monthStart, end: monthEnd })
      );
      const total = quotesInMonth.length;
      const converted = quotesInMonth.filter((q) => q.status === "quoted" || q.status === "booked").length;
      const rate = total > 0 ? Math.round((converted / total) * 100) : 0;
      return { month: label, rate };
    });

    return { revenueData, conversionData };
  }, [dateRange, jobs, quotes, invoices]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Analytics</h1>
          <p className="text-wraptors-muted mt-0.5">Business insights</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly revenue (k)</CardTitle>
            <CardDescription>For selected date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="month" stroke="#737373" fontSize={12} />
                  <YAxis stroke="#737373" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #2a2a2a",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value}k`, ""]}
                  />
                  <Bar dataKey="revenue" fill="#C8A45D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Jobs completed</CardTitle>
            <CardDescription>For selected date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="month" stroke="#737373" fontSize={12} />
                  <YAxis stroke="#737373" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #2a2a2a",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="jobs" fill="#737373" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quote conversion rate (%)</CardTitle>
          <CardDescription>For selected date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="month" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value}%`, "Conversion"]}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#C8A45D"
                  strokeWidth={2}
                  dot={{ fill: "#C8A45D" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {hasPermission("analytics.view_full") && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Technician performance</CardTitle>
              <CardDescription>Completed jobs and revenue from Supabase</CardDescription>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTechPeriod("week")}
                className={`rounded-md px-3 py-1 text-sm ${
                  techPeriod === "week"
                    ? "bg-wraptors-gold/20 text-wraptors-gold"
                    : "text-wraptors-muted hover:text-white"
                }`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setTechPeriod("month")}
                className={`rounded-md px-3 py-1 text-sm ${
                  techPeriod === "month"
                    ? "bg-wraptors-gold/20 text-wraptors-gold"
                    : "text-wraptors-muted hover:text-white"
                }`}
              >
                Month
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-wraptors-border overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-wraptors-border bg-wraptors-charcoal/50">
                    <th className="text-left font-medium text-wraptors-muted px-4 py-3">Technician</th>
                    <th className="text-left font-medium text-wraptors-muted px-4 py-3">Completed</th>
                    <th className="text-left font-medium text-wraptors-muted px-4 py-3">Revenue</th>
                    <th className="text-left font-medium text-wraptors-muted px-4 py-3">Avg rating</th>
                  </tr>
                </thead>
                <tbody>
                  {techRows.map((t) => (
                    <tr key={t.id} className="border-b border-wraptors-border/50">
                      <td className="px-4 py-3 font-medium">{t.name}</td>
                      <td className="px-4 py-3">{t.completed_jobs}</td>
                      <td className="px-4 py-3 text-wraptors-gold">{formatCurrency(t.revenue)}</td>
                      <td className="px-4 py-3 text-wraptors-muted">
                        {t.avg_rating != null ? `${t.avg_rating} ★` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {techRows.length === 0 && (
                <p className="p-6 text-sm text-wraptors-muted text-center">No completed jobs in this period.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
