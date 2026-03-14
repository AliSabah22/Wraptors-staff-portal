"use client";

import { useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useJobsStore, useCustomersStore, useVehiclesStore, useTeamStore } from "@/stores";
import { mockServices } from "@/data/mock";
import { JobDetailView } from "@/components/jobs/job-detail-view";
import { JOB_STAGES, STAGE_PROGRESS } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
import { canAccessJob } from "@/lib/data-scope";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, role } = useCurrentUser();
  const jobId = params.id as string;
  // Subscribe to the job so the UI updates when scheduling fields change (date pickers, etc.)
  const job = useJobsStore((s) => s.jobs.find((j) => j.id === jobId));
  const getCustomerById = useCustomersStore((s) => s.getCustomerById);
  const getVehicleById = useVehiclesStore((s) => s.getVehicleById);
  const teamMembers = useTeamStore((s) => s.members);
  const technicians = useMemo(
    () => teamMembers.filter((m) => m.role === "technician"),
    [teamMembers]
  );

  // Technician may only view jobs assigned to them; redirect if accessing another's job.
  useEffect(() => {
    if (!job || !role || !user) return;
    if (!canAccessJob(role, user.id, job)) {
      router.replace("/jobs");
    }
  }, [job, role, user, router]);

  const mayAccessJob = job && (!user || !role || canAccessJob(role, user.id, job));

  if (!job) {
    return (
      <Card className="border-wraptors-border border-dashed max-w-md mx-auto mt-12">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-wraptors-gold/10 text-wraptors-gold mb-4">
            <Wrench className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-white">Job not found</h3>
          <p className="text-sm text-wraptors-muted mt-1">
            This job may have been removed or the link is incorrect.
          </p>
          <Button variant="outline" className="mt-6 gap-2" onClick={() => router.push("/jobs")}>
            Back to Active Jobs
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!mayAccessJob) {
    return null; // Redirecting in useEffect
  }

  const customer = getCustomerById(job.customerId) ?? null;
  const vehicle = getVehicleById(job.vehicleId) ?? null;
  const service = mockServices.find((s) => s.id === job.serviceId) ?? null;
  const technician = job.assignedTechnicianId
    ? teamMembers.find((m) => m.id === job.assignedTechnicianId) ?? null
    : null;

  return (
    <JobDetailView
      job={job}
      customer={customer}
      vehicle={vehicle}
      service={service}
      technician={technician}
      allStages={JOB_STAGES}
      stageProgressMap={STAGE_PROGRESS}
      technicians={technicians}
    />
  );
}
