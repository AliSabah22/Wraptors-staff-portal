"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useJobsStore } from "@/stores";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Wrench, Calendar, Upload, AlertCircle, Car } from "lucide-react";

const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

/** Clamp progress to 0–100 for Progress component (handles undefined/NaN). */
function safeProgress(value: unknown): number {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export function TechnicianDashboard() {
  const { user } = useCurrentUser();
  const jobs = useJobsStore((s) => s.jobs) ?? [];

  const assignedJobs = useMemo(
    () => (Array.isArray(jobs) ? jobs : []).filter((j) => j?.assignedTechnicianId === user?.id),
    [jobs, user?.id]
  );
  const today = new Date().toDateString();
  const assignedToday = useMemo(
    () =>
      assignedJobs.filter((j) => j?.dueDate && new Date(j.dueDate).toDateString() === today),
    [assignedJobs, today]
  );
  const overdue = useMemo(
    () =>
      assignedJobs.filter(
        (j) => j?.dueDate && new Date(j.dueDate).toDateString() < today && j.stage !== "ready"
      ),
    [assignedJobs, today]
  );
  const inProgress = useMemo(
    () => assignedJobs.filter((j) => j.stage !== "ready" && !j.completedAt),
    [assignedJobs]
  );
  const nextVehicleDue = useMemo(() => {
    const pending = assignedJobs
      .filter((j) => j?.dueDate && j.stage !== "ready" && !j.completedAt)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return pending[0] ?? null;
  }, [assignedJobs]);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">My jobs</h1>
        <p className="text-wraptors-muted mt-0.5">Assigned to you · progress & updates</p>
      </div>

      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-wraptors-border bg-wraptors-charcoal/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-wraptors-muted">Assigned today</CardTitle>
            <Calendar className="h-4 w-4 text-wraptors-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{assignedToday.length}</p>
            <p className="text-xs text-wraptors-muted">jobs due today</p>
          </CardContent>
        </Card>
        <Card className="border-wraptors-border bg-wraptors-charcoal/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-wraptors-muted">Overdue stages</CardTitle>
            <AlertCircle className="h-4 w-4 text-wraptors-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{overdue.length}</p>
            <p className="text-xs text-wraptors-muted">need update</p>
          </CardContent>
        </Card>
        <Card className="border-wraptors-border bg-wraptors-charcoal/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-wraptors-muted">In progress</CardTitle>
            <Wrench className="h-4 w-4 text-wraptors-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{inProgress.length}</p>
            <p className="text-xs text-wraptors-muted">active</p>
          </CardContent>
        </Card>
        <Card className="border-wraptors-border bg-wraptors-charcoal/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-wraptors-muted">Upload media</CardTitle>
            <Upload className="h-4 w-4 text-wraptors-gold" />
          </CardHeader>
          <CardContent className="pt-2">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/media">Upload photos</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {nextVehicleDue && (
        <motion.div variants={item}>
          <Card className="border-wraptors-gold/30 bg-wraptors-charcoal/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Car className="h-5 w-5 text-wraptors-gold" />
                Next vehicle due
              </CardTitle>
              <CardDescription>
                Job {nextVehicleDue.id?.slice(-4) ?? "—"} · Due {nextVehicleDue.dueDate ? formatDate(nextVehicleDue.dueDate) : "—"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={safeProgress(nextVehicleDue.progress)} className="h-2 mb-3" />
              <Button size="sm" asChild>
                <Link href={`/jobs/${nextVehicleDue.id}`}>Open job</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={item}>
        <Card className="border-wraptors-border bg-wraptors-charcoal/50">
          <CardHeader>
            <CardTitle className="text-white">Your assigned jobs</CardTitle>
            <CardDescription>Update stage and add notes</CardDescription>
          </CardHeader>
          <CardContent>
            {assignedJobs.length === 0 ? (
              <p className="text-sm text-wraptors-muted">No jobs assigned to you.</p>
            ) : (
              <ul className="space-y-3">
                {assignedJobs.slice(0, 10).map((j) => (
                  <li
                    key={j.id}
                    className="flex items-center justify-between rounded-lg border border-wraptors-border/50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">Job {j.id?.slice(-4) ?? "—"}</p>
                      <p className="text-xs text-wraptors-muted">
                        {j.dueDate ? `Due ${formatDate(j.dueDate)}` : "No due date"} · {safeProgress(j.progress)}%
                      </p>
                    </div>
                    <Progress value={safeProgress(j.progress)} className="w-24 h-2" />
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/jobs/${j.id}`}>Open</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
