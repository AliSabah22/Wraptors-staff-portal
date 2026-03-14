"use client";

import { useState } from "react";
import { useJobsStore, useUIStore, useCustomersStore, useVehiclesStore, useTeamStore } from "@/stores";
import { mockServices } from "@/data/mock";
import { DeleteCustomerOptionsDialog } from "@/components/customers/delete-customer-options-dialog";
import { JOB_STAGES } from "@/types";
import { JobsKanban } from "@/components/jobs/jobs-kanban";
import { JobsTable } from "@/components/jobs/jobs-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { getScopedJobs } from "@/lib/data-scope/scope";
import { formatJobStage } from "@/lib/utils";
import { canTransitionTo, stageRequiresPhoto } from "@/lib/job-workflow/stage-transitions";
import type { JobStage } from "@/types";

function getServiceName(id: string) {
  return mockServices.find((s) => s.id === id)?.name ?? "—";
}

export default function JobsPage() {
  const jobs = useJobsStore((s) => s.jobs);
  const updateJobStage = useJobsStore((s) => s.updateJobStage);
  const customers = useCustomersStore((s) => s.customers);
  const getVehicleById = useVehiclesStore((s) => s.getVehicleById);
  const teamMembers = useTeamStore((s) => s.members);
  const { activeJobsView, setActiveJobsView, setCreateJobModalOpen } = useUIStore();
  const { user, role } = useCurrentUser();
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDialogCustomerId, setDeleteDialogCustomerId] = useState<string | null>(null);
  const [deleteDialogCustomerName, setDeleteDialogCustomerName] = useState("");

  const getTechnicianName = (id: string | undefined) => {
    if (!id) return "Unassigned";
    return teamMembers.find((m) => m.id === id)?.name ?? "—";
  };
  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";
  const getVehicleLabel = (id: string) => {
    const v = getVehicleById(id);
    return v ? `${v.make} ${v.model} (${v.year})` : "—";
  };

  const onDeleteCustomer = (customerId: string, customerName: string) => {
    setDeleteDialogCustomerId(customerId);
    setDeleteDialogCustomerName(customerName);
    setDeleteDialogOpen(true);
  };

  const handleMoveJob = (jobId: string, newStage: JobStage) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    const isTechnician = role === "technician";
    if (isTechnician) {
      if (!canTransitionTo(job.stage, newStage, role)) return;
      if (stageRequiresPhoto(newStage) && (!job.mediaIds || job.mediaIds.length === 0)) return;
    }
    updateJobStage(jobId, newStage, undefined, user?.id);
  };

  const scopedJobs = getScopedJobs(role, user?.id, jobs);
  const activeJobs = scopedJobs.filter((j) => j.stage !== "ready" || !j.completedAt);

  const jobsWithDetails = activeJobs.map((job) => ({
    ...job,
    customerName: getCustomerName(job.customerId),
    vehicleLabel: getVehicleLabel(job.vehicleId),
    serviceName: getServiceName(job.serviceId),
    technicianName: getTechnicianName(job.assignedTechnicianId),
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {hasPermission("jobs.view_assigned") && !hasPermission("jobs.view_operational") ? "My Jobs" : "Active Jobs"}
          </h1>
          <p className="text-wraptors-muted mt-0.5">
            {activeJobs.length} {hasPermission("jobs.view_assigned") && !hasPermission("jobs.view_operational") ? "assigned to you" : "vehicles in shop"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission("jobs.create") && (
            <Button className="gap-2" onClick={() => setCreateJobModalOpen(true)}>
              <Plus className="h-4 w-4" />
              New job
            </Button>
          )}
          <Tabs
          value={activeJobsView}
          onValueChange={(v) => setActiveJobsView(v as "kanban" | "table")}
        >
          <TabsList className="bg-wraptors-charcoal">
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="h-4 w-4" /> Kanban
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <List className="h-4 w-4" /> Table
            </TabsTrigger>
          </TabsList>
        </Tabs>
        </div>
      </div>

      {activeJobsView === "kanban" ? (
        <JobsKanban
          jobs={jobsWithDetails}
          columns={JOB_STAGES.map((stage) => ({
            id: stage,
            title: formatJobStage(stage),
          }))}
          onMoveJob={handleMoveJob}
          onDeleteCustomer={hasPermission("customers.delete") ? onDeleteCustomer : undefined}
        />
      ) : (
        <JobsTable jobs={jobsWithDetails} />
      )}

      <DeleteCustomerOptionsDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteDialogCustomerId(null);
            setDeleteDialogCustomerName("");
          }
        }}
        customerId={deleteDialogCustomerId}
        customerName={deleteDialogCustomerName}
      />
    </motion.div>
  );
}
