"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenuePayload = {
  today: number;
  this_week: number;
  this_month: number;
  last_month: number;
  month_vs_last_percent: number | null;
  last_7_days: { date: string; label: string; revenue: number }[];
};

export function CEORevenueSnapshot() {
  const [data, setData] = useState<RevenuePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/revenue", { credentials: "include" });
      const json = (await res.json()) as { success?: boolean; data?: RevenuePayload; error?: string };
      if (!res.ok || json.success === false) {
        setError(json.error ?? "Could not load revenue");
        return;
      }
      if (json.data) {
        setData(json.data);
        setError(null);
      }
    } catch {
      setError("Network error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <Card className="border-wraptors-border border-l-4 border-l-wraptors-gold">
        <CardHeader>
          <CardTitle>Revenue snapshot</CardTitle>
          <CardDescription className="text-red-400">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-wraptors-border border-l-4 border-l-wraptors-gold animate-pulse">
        <CardHeader>
          <CardTitle>Revenue snapshot</CardTitle>
          <CardDescription>Loading paid invoice totals…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const pct = data.month_vs_last_percent;
  const up = pct != null && pct >= 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-wraptors-border border-l-4 border-l-wraptors-gold lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle>Revenue snapshot</CardTitle>
          <CardDescription>Paid invoices (recognized on payment date)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-wraptors-border bg-wraptors-charcoal/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-wraptors-muted">Today</p>
              <p className="mt-1 text-2xl font-bold text-white">{formatCurrency(data.today)}</p>
            </div>
            <div className="rounded-lg border border-wraptors-border bg-wraptors-charcoal/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-wraptors-muted">This week</p>
              <p className="mt-1 text-2xl font-bold text-white">{formatCurrency(data.this_week)}</p>
            </div>
            <div className="rounded-lg border border-wraptors-border bg-wraptors-charcoal/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-wraptors-muted">This month</p>
              <p className="mt-1 text-2xl font-bold text-wraptors-gold">{formatCurrency(data.this_month)}</p>
            </div>
            <div className="rounded-lg border border-wraptors-border bg-wraptors-charcoal/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-wraptors-muted">Last month</p>
              <p className="mt-1 text-2xl font-bold text-white">{formatCurrency(data.last_month)}</p>
              {pct != null && (
                <p
                  className={cn(
                    "mt-2 flex items-center gap-1 text-sm font-medium",
                    up ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {up ? "+" : ""}
                  {pct}% vs last month
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-wraptors-border lg:col-span-2">
        <CardHeader>
          <CardTitle>Last 7 days (paid)</CardTitle>
          <CardDescription>Daily totals from invoices marked paid</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.last_7_days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="label" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} tickFormatter={(v) => `$${Number(v) / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Paid"]}
                />
                <Bar dataKey="revenue" fill="#C8A45D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
