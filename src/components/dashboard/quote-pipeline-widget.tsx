"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuoteBuilderStore } from "@/stores/quote-builder";
import { canViewQuoteStats } from "@/lib/quote-builder/access";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatCurrency } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";

/**
 * CEO-only Quote Pipeline widget. Kept in a separate file so the quote-builder
 * store is loaded in its own chunk and does not bloat the main dashboard bundle.
 */
export function QuotePipelineWidget() {
  const { role } = useCurrentUser();
  const getQuoteBuilderStats = useQuoteBuilderStore((s) => s.getStats);

  const stats = useMemo(() => {
    if (!canViewQuoteStats(role)) return null;
    try {
      return getQuoteBuilderStats();
    } catch {
      return null;
    }
  }, [role, getQuoteBuilderStats]);

  if (!stats) return null;

  const barData = [
    { status: "Draft", count: stats.quotesByStatus.draft, fill: "#737373" },
    { status: "Sent", count: stats.quotesByStatus.sent, fill: "#C8A45D" },
    { status: "Accepted", count: stats.quotesByStatus.accepted, fill: "#22c55e" },
    { status: "Declined", count: stats.quotesByStatus.declined, fill: "#ef4444" },
    { status: "Expired", count: stats.quotesByStatus.expired, fill: "#f59e0b" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Quote Pipeline</CardTitle>
          <CardDescription>Smart Quote Builder</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/quotes">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xl font-bold text-wraptors-gold">{stats.sentThisMonth}</p>
            <p className="text-xs text-wraptors-muted">Sent this month</p>
          </div>
          <div>
            <p className="text-xl font-bold">{stats.acceptanceRate}%</p>
            <p className="text-xs text-wraptors-muted">Acceptance rate</p>
          </div>
          <div>
            <p className="text-xl font-bold">{formatCurrency(stats.averageQuoteValue)}</p>
            <p className="text-xs text-wraptors-muted">Avg value</p>
          </div>
        </div>
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="status" tick={{ fontSize: 10 }} stroke="#737373" />
              <YAxis width={24} tick={{ fontSize: 10 }} stroke="#737373" />
              <Bar dataKey="count" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
