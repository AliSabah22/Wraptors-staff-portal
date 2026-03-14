"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useRehydrateJobsOnFocus } from "@/hooks/useRehydrateJobsOnFocus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useJobsStore, useQuotesStore, useCustomersStore, useTeamStore, useVehiclesStore, useServicesStore, useUIStore } from "@/stores";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Calendar, FileText, Users, Wrench, Package, UserCog, UserPlus } from "lucide-react";

const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const MS_7_DAYS = 7 * 24 * 60 * 60 * 1000;

function getJobDisplayId(jobId: string): string {
  const match = jobId.match(/(\d{4,})$/);
  return match ? `#${match[1].slice(-4)}` : jobId.slice(-6);
}

export function ReceptionistDashboard() {
  useRehydrateJobsOnFocus();
  const jobs = useJobsStore((s) => s.jobs) ?? [];
  const quotes = useQuotesStore((s) => s.quotes) ?? [];
  const customers = useCustomersStore((s) => s.customers) ?? [];
  const teamMembers = useTeamStore((s) => s.members) ?? [];
  const getVehicleById = useVehiclesStore((s) => s.getVehicleById);
  const getServiceById = useServicesStore((s) => s.getServiceById);
  const setAddCustomerModalOpen = useUIStore((s) => s.setAddCustomerModalOpen);

  const today = new Date().toDateString();
  const activeJobsForWorkload = useMemo(
    () => (Array.isArray(jobs) ? jobs : []).filter((j) => j?.stage !== "ready" && !j?.completedAt),
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
              jobs: activeJobsForWorkload.filter((j) => j?.assignedTechnicianId === t.id).length,
            }))
        : [],
    [teamMembers, activeJobsForWorkload]
  );
  const maxWorkloadForBar = Math.max(1, ...techWorkload.map((t) => t.jobs), 5);
  const dropOffsToday = useMemo(
    () =>
      jobs.filter(
        (j) =>
          j?.dueDate &&
          new Date(j.dueDate).toDateString() === today &&
          j.stage !== "ready" &&
          !j.completedAt
      ),
    [jobs, today]
  );
  const pickupsToday = useMemo(
    () =>
      jobs.filter(
        (j) =>
          (j?.stage === "ready" || !!j?.completedAt) &&
          j?.dueDate &&
          new Date(j.dueDate).toDateString() === today
      ),
    [jobs, today]
  );
  const pendingQuotes = (Array.isArray(quotes) ? quotes : []).filter(
    (q) => q?.status === "new" || q?.status === "contacted"
  );
  const newCustomers = useMemo(() => {
    const cutoff = Date.now() - MS_7_DAYS;
    return (Array.isArray(customers) ? customers : []).filter(
      (c) => c?.createdAt && new Date(c.createdAt).getTime() > cutoff
    );
  }, [customers]);

  // Same definition as calendar "Unscheduled jobs": intake OR no technician OR no scheduled start
  const jobsNeedingScheduling = useMemo(() => {
    const list = Array.isArray(jobs) ? jobs : [];
    const needing = list
      .filter(
        (j) =>
          !j?.completedAt &&
          (j?.stage === "intake" || !j?.assignedTechnicianId || !j?.scheduledStartDate)
      )
      .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime());
    return needing.map((j) => {
      const customer = customers.find((c) => c?.id === j.customerId);
      const vehicle = getVehicleById?.(j.vehicleId);
      const service = getServiceById?.(j.serviceId);
      return {
        ...j,
        customerName: customer?.name ?? "Unknown customer",
        vehicleLabel: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "—",
        serviceName: service?.name ?? "—",
        jobDisplayId: getJobDisplayId(j.id ?? ""),
      };
    });
  }, [jobs, customers, getVehicleById, getServiceById]);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Operational dashboard</h1>
        <p className="text-wraptors-muted mt-0.5">Today&apos;s drop-offs, pickups & pending quotes</p>
      </div>

      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-wraptors-border bg-wraptors-charcoal/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-wraptors-muted">Today&apos;s drop-offs</CardTitle>
            <Calendar className="h-4 w-4 text-wraptors-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{dropOffsToday.length}</p>
            <p className="text-xs text-wraptors-muted">vehicles due in</p>
          </CardContent>
        </Card>
        <Card className="border-wraptors-border bg-wraptors-charcoal/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-wraptors-muted">Pickups today</CardTitle>
            <Package className="h-4 w-4 text-wraptors-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{pickupsToday.length}</p>
            <p className="text-xs text-wraptors-muted">ready for customer</p>
          </CardContent>
        </Card>
        <Card className="border-wraptors-border bg-wraptors-charcoal/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-wraptors-muted">Pending quotes</CardTitle>
            <FileText className="h-4 w-4 text-wraptors-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{pendingQuotes.length}</p>
            <p className="text-xs text-wraptors-muted">awaiting response</p>
          </CardContent>
        </Card>
        <Card className="border-wraptors-border bg-wraptors-charcoal/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-wraptors-muted">New customers</CardTitle>
            <Users className="h-4 w-4 text-wraptors-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{newCustomers.length}</p>
            <p className="text-xs text-wraptors-muted">last 7 days</p>
          </CardContent>
        </Card>
        <Card className="border-wraptors-border bg-wraptors-charcoal/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-wraptors-muted">Needing scheduling</CardTitle>
            <Wrench className="h-4 w-4 text-wraptors-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{jobsNeedingScheduling.length}</p>
            <p className="text-xs text-wraptors-muted">need technician or start date</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-wraptors-border bg-wraptors-charcoal/50">
          <CardHeader>
            <CardTitle className="text-white">Jobs needing scheduling</CardTitle>
            <CardDescription>
              Intake jobs not yet assigned or scheduled. Open a job to assign a technician and set the schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobsNeedingScheduling.length === 0 ? (
              <div className="rounded-lg border border-wraptors-border/50 bg-wraptors-black/30 px-4 py-6 text-center">
                <p className="text-sm text-wraptors-muted">
                  No jobs in intake. New jobs appear here when you add a customer or create a job from a quote.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={() => setAddCustomerModalOpen(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Add customer
                </Button>
              </div>
            ) : (
              <>
                <ul className="space-y-2">
                  {jobsNeedingScheduling.slice(0, 8).map((j) => (
                    <li
                      key={j.id}
                      className="flex flex-col gap-0.5 rounded-lg border border-wraptors-border/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{j.customerName}</p>
                        <p className="text-xs text-wraptors-muted">
                          {j.vehicleLabel} · {j.dueDate ? `Due ${formatDate(j.dueDate)}` : "No due date"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-wraptors-muted hidden sm:inline" aria-hidden>
                          Job {j.jobDisplayId}
                        </span>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/jobs/${j.id}`}>Open & schedule</Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
                {jobsNeedingScheduling.length > 8 && (
                  <p className="text-center">
                    <Button variant="link" size="sm" className="text-wraptors-gold" asChild>
                      <Link href="/jobs">View all in Active Jobs</Link>
                    </Button>
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-wraptors-border bg-wraptors-charcoal/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UserCog className="h-4 w-4 text-wraptors-gold" />
              Technician workload
            </CardTitle>
            <CardDescription>Active assignments — use this when scheduling</CardDescription>
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
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-wraptors-border bg-wraptors-charcoal/50">
          <CardHeader>
            <CardTitle className="text-white">Quick links</CardTitle>
            <CardDescription>Operational shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/quote-requests">Quote requests</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/jobs">Active jobs</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/customers">Customers</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/calendar">Calendar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
