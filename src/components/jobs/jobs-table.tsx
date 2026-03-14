"use client";

import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatJobStage } from "@/lib/utils";
import { isStandardPriority, JOB_PRIORITY_LABELS } from "@/lib/job-workflow/config";
import type { JobStage, JobPriority } from "@/types";

interface JobWithDetails {
  id: string;
  customerName: string;
  vehicleLabel: string;
  serviceName: string;
  technicianName: string;
  stage: JobStage;
  progress: number;
  dueDate: string;
  priority?: string;
  isBlocked?: boolean;
}

export function JobsTable({ jobs }: { jobs: JobWithDetails[] }) {
  return (
    <div className="rounded-xl border border-wraptors-border bg-wraptors-surface overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-wraptors-border bg-wraptors-charcoal/50">
            <th className="text-left font-medium text-wraptors-muted px-6 py-4">Customer</th>
            <th className="text-left font-medium text-wraptors-muted px-6 py-4">Vehicle</th>
            <th className="text-left font-medium text-wraptors-muted px-6 py-4">Service</th>
            <th className="text-left font-medium text-wraptors-muted px-6 py-4">Stage</th>
            <th className="text-left font-medium text-wraptors-muted px-6 py-4">Progress</th>
            <th className="text-left font-medium text-wraptors-muted px-6 py-4">Technician</th>
            <th className="text-left font-medium text-wraptors-muted px-6 py-4">Due</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="border-b border-wraptors-border/50 hover:bg-wraptors-surface-hover/50 transition-colors"
            >
              <td className="px-6 py-4">
                <Link href={`/jobs/${job.id}`} className="font-medium text-white hover:text-wraptors-gold">
                  {job.customerName}
                </Link>
              </td>
              <td className="px-6 py-4 text-wraptors-muted-light">{job.vehicleLabel}</td>
              <td className="px-6 py-4 text-wraptors-gold">{job.serviceName}</td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">{formatJobStage(job.stage)}</Badge>
                  {!isStandardPriority(job.priority) && (
                    <Badge variant="outline" className="text-wraptors-gold border-wraptors-gold/50 text-[10px]">
                      {job.priority ? (JOB_PRIORITY_LABELS[job.priority as JobPriority] ?? job.priority) : ""}
                    </Badge>
                  )}
                  {job.isBlocked && (
                    <Badge variant="destructive" className="text-[10px]">Blocked</Badge>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 w-24">
                  <Progress value={job.progress} className="h-2 flex-1" />
                  <span className="text-wraptors-muted text-xs w-8">{job.progress}%</span>
                </div>
              </td>
              <td className="px-6 py-4 text-wraptors-muted-light">{job.technicianName}</td>
              <td className="px-6 py-4 text-wraptors-muted">{formatDate(job.dueDate)}</td>
              <td className="px-6 py-4">
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-wraptors-gold hover:underline text-xs"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
