"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getRangeForPreset } from "@/lib/date-range";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import { useJobsStore, useQuotesStore } from "@/stores";
import { mockInvoices } from "@/data/mock";
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

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState(() => getRangeForPreset("last_30"));
  const jobs = useJobsStore((s) => s.jobs);
  const quotes = useQuotesStore((s) => s.quotes);

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
      const invoicesInMonth = mockInvoices.filter((inv) =>
        isWithinInterval(new Date(inv.createdAt), { start: monthStart, end: monthEnd })
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
  }, [dateRange, jobs, quotes]);

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
    </motion.div>
  );
}
