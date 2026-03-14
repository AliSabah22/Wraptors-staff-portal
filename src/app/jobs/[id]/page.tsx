"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useJobsStore, useCustomersStore, useVehiclesStore, useTeamStore } from "@/stores";
import { mockServices } from "@/data/mock";
import { JobDetailView } from "@/components/jobs/job-detail-view";
import { JOB_STAGES, STAGE_PROGRESS } from "@/types";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
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

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-wraptors-muted">Job not found.</p>
        <button
          type="button"
          onClick={() => router.push("/jobs")}
          className="mt-4 text-wraptors-gold hover:underline"
        >
          Back to Active Jobs
        </button>
      </div>
    );
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
