"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useJobsStore, useQuotesStore, useNotificationsStore, useTeamStore } from "@/stores";
import { mockInvoices } from "@/data/mock";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getRangeForPreset, isDateInRange } from "@/lib/date-range";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { TechnicianDashboard } from "@/components/dashboard/technician-dashboard";
import { ReceptionistDashboard } from "@/components/dashboard/receptionist-dashboard";
import {
  Car,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  Target,
  Activity,
  UserCog,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

// Mock chart data
const revenueData = [
  { month: "Sep", revenue: 42000 },
  { month: "Oct", revenue: 51000 },
  { month: "Nov", revenue: 48000 },
  { month: "Dec", revenue: 62000 },
  { month: "Jan", revenue: 58000 },
  { month: "Feb", revenue: 71000 },
  { month: "Mar", revenue: 65000 },
];

export function DashboardPage() {
  const { role } = useCurrentUser();
  const { hasPermission } = usePermissions();

  if (hasPermission("dashboard.view_personal") && !hasPermission("dashboard.view_operational") && !hasPermission("dashboard.view_full")) {
    return <TechnicianDashboard />;
  }
  if (hasPermission("dashboard.view_operational") && !hasPermission("dashboard.view_full")) {
    return <ReceptionistDashboard />;
  }

  return <CEODashboard />;
}

export function CEODashboard() {
  const [dateRange, setDateRange] = useState(() => getRangeForPreset("last_30"));

  const jobs = useJobsStore((s) => s.jobs) ?? [];
  const quotes = useQuotesStore((s) => s.quotes) ?? [];
  const notifications = useNotificationsStore((s) => s.items) ?? [];

  const jobsInRange = useMemo(
    () => jobs.filter((j) => isDateInRange(j.dueDate, dateRange) || isDateInRange(j.createdAt, dateRange)),
    [jobs, dateRange]
  );
  const activeJobs = jobsInRange.filter((j) => j.stage !== "ready" && !j.completedAt);
  const jobsDueToday = jobs.filter((j) => {
    const due = new Date(j.dueDate).toDateString();
    const today = new Date().toDateString();
    return due === today && j.stage !== "ready";
  });
  const pendingQuotes = quotes.filter((q) => q.status === "new" || q.status === "contacted");
  const monthlyRevenue = mockInvoices
    .filter((i) => i.status === "paid" || i.status === "sent")
    .reduce((sum, i) => sum + i.total, 0) + 22700; // mock extra
  const completedJobsInRange = jobsInRange.filter((j) => j.progress === 100);
  const completedJobs = jobs.filter((j) => j.progress === 100);
  const avgJobValue =
    completedJobsInRange.length > 0
      ? completedJobsInRange.reduce((s, j) => s + 4500, 0) / completedJobsInRange.length
      : completedJobs.length > 0
        ? completedJobs.reduce((s, j) => s + 4500, 0) / completedJobs.length
        : 0;
  const quotedCount = quotes.filter((q) => q.status === "quoted" || q.status === "booked").length;
  const conversionRate = quotes.length > 0 ? Math.round((quotedCount / quotes.length) * 100) : 0;

  const jobStatusPieData = [
    {
      name: "In Progress",
      value: jobsInRange.filter((j) => j.stage !== "intake" && j.stage !== "ready").length,
      color: "#C8A45D",
    },
    {
      name: "Intake",
      value: jobsInRange.filter((j) => j.stage === "intake").length,
      color: "#737373",
    },
    {
      name: "Ready",
      value: jobsInRange.filter((j) => j.stage === "ready").length,
      color: "#22c55e",
    },
  ].filter((d) => d.value > 0);

  const hasJobDistributionData = jobStatusPieData.length > 0;

  const recentActivity = useMemo(
    () =>
      notifications
        .filter((n) => isDateInRange(n.createdAt, dateRange))
        .slice(0, 5),
    [notifications, dateRange]
  );

  const teamMembers = useTeamStore((s) => s.members) ?? [];
  const activeJobsForWorkload = useMemo(
    () => (jobs ?? []).filter((j) => j.stage !== "ready" && !j.completedAt),
    [jobs]
  );
  const techWorkload = useMemo(
    () =>
      Array.isArray(teamMembers)
        ? teamMembers
            .filter((s) => s?.role === "technician")
            .map((t) => ({
              id: t.id,
              name: t.name,
              jobs: activeJobsForWorkload.filter((j) => j.assignedTechnicianId === t.id).length,
            }))
        : [],
    [teamMembers, activeJobsForWorkload]
  );
  const maxWorkloadForBar = Math.max(1, ...techWorkload.map((t) => t.jobs), 5);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="text-wraptors-muted mt-0.5">
            Operational overview
          </p>
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
      </motion.div>

      {/* KPI cards */}
      <motion.div
        variants={item}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-wraptors-muted">
              Active in shop
            </CardTitle>
            <Car className="h-4 w-4 text-wraptors-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-wraptors-gold">{activeJobs.length}</p>
            <p className="text-xs text-wraptors-muted">vehicles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-wraptors-muted">
              Due today
            </CardTitle>
            <Calendar className="h-4 w-4 text-wraptors-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{jobsDueToday.length}</p>
            <p className="text-xs text-wraptors-muted">jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-wraptors-muted">
              Pending quotes
            </CardTitle>
            <FileText className="h-4 w-4 text-wraptors-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingQuotes.length}</p>
            <p className="text-xs text-wraptors-muted">awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-wraptors-muted">
              Monthly revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-wraptors-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</p>
            <p className="text-xs text-wraptors-muted">MTD</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-wraptors-muted">
              Avg job value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-wraptors-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(avgJobValue)}</p>
            <p className="text-xs text-wraptors-muted">average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-wraptors-muted">
              Quote conversion
            </CardTitle>
            <Target className="h-4 w-4 text-wraptors-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{conversionRate}%</p>
            <p className="text-xs text-wraptors-muted">rate</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts row */}
      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
            <CardDescription>For selected date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C8A45D" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#C8A45D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="month" stroke="#737373" fontSize={12} />
                  <YAxis stroke="#737373" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #2a2a2a",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#C8A45D"
                    strokeWidth={2}
                    fill="url(#goldGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Job status distribution</CardTitle>
            <CardDescription>Jobs in selected date range by stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center justify-center">
              {hasJobDistributionData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={jobStatusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {jobStatusPieData.map((entry, i) => (
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
      </motion.div>

      {/* Bottom row: Activity, Workload, Quick actions */}
      <motion.div variants={item} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
            <ul className="space-y-4">
              {recentActivity.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-3 rounded-lg border border-wraptors-border/50 p-3 transition-colors hover:border-wraptors-gold/30"
                >
                  <div
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                      n.read ? "bg-wraptors-muted" : "bg-wraptors-gold"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-wraptors-muted mt-0.5">{n.message}</p>
                    <p className="text-xs text-wraptors-muted mt-1">
                      {formatDate(n.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-wraptors-gold" />
              Technician workload
            </CardTitle>
            <CardDescription>Active assignments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {techWorkload.length === 0 ? (
              <p className="text-sm text-wraptors-muted">No technicians on roster.</p>
            ) : (
              techWorkload.map((t) => (
                <div key={t.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-white">{t.name}</span>
                    <span className="text-wraptors-muted">{t.jobs} active job{t.jobs !== 1 ? "s" : ""}</span>
                  </div>
                  <Progress
                    value={Math.min((t.jobs / maxWorkloadForBar) * 100, 100)}
                    className="h-2"
                  />
                </div>
              ))
            )}
            <div className="pt-4 border-t border-wraptors-border">
              <p className="text-xs text-wraptors-muted">Quick actions</p>
              <div className="mt-2 flex flex-col gap-2">
                <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                  <Link href="/jobs?create=1">
                    <Plus className="h-4 w-4" /> New job
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                  <Link href="/customers">
                    <Plus className="h-4 w-4" /> New customer
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                  <Link href="/quote-requests">
                    <Plus className="h-4 w-4" /> New quote
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
