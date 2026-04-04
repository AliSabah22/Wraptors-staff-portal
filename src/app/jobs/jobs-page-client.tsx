"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useJobsStore, useUIStore, useCustomersStore, useVehiclesStore, useTeamStore } from "@/stores";
import { DeleteCustomerOptionsDialog } from "@/components/customers/delete-customer-options-dialog";
import { JOB_STAGES } from "@/types";
import { JobsKanban } from "@/components/jobs/jobs-kanban";
import { JobsTable } from "@/components/jobs/jobs-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, List, Plus, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { getScopedJobs } from "@/lib/data-scope/scope";
import { formatJobStage } from "@/lib/utils";
import { canTransitionTo, stageRequiresPhoto } from "@/lib/job-workflow/stage-transitions";
import type { Customer, JobStage, ServiceJob, Vehicle } from "@/types";
import { useSeedJobsStore } from "@/hooks/useSeedJobsStore";

export function JobsPageClient({
  initialJobs,
  initialCustomers,
  initialVehicles,
}: {
  initialJobs: ServiceJob[];
  initialCustomers: Customer[];
  initialVehicles: Vehicle[];
}) {
  const setCustomers = useCustomersStore((s) => s.setCustomers);
  const setVehicles = useVehiclesStore((s) => s.setVehicles);

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers, setCustomers]);

  useEffect(() => {
    setVehicles(initialVehicles);
  }, [initialVehicles, setVehicles]);

  useSeedJobsStore(initialJobs);

  const [serviceCatalog, setServiceCatalog] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/services")
      .then((r) => r.json())
      .then(
        (body: {
          success?: boolean;
          data?: Array<{ id: string; name: string }>;
        }) => {
          if (cancelled || !body?.success || !Array.isArray(body.data)) return;
          setServiceCatalog(body.data.map((s) => ({ id: s.id, name: s.name })));
        }
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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

  const customerNameById = useMemo(() => {
    const m = new Map<string, string>();
    customers.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [customers]);

  const technicianNameById = useMemo(() => {
    const m = new Map<string, string>();
    teamMembers.forEach((t) => m.set(t.id, t.name));
    return m;
  }, [teamMembers]);

  const scopedJobs = useMemo(
    () => getScopedJobs(role, user?.id, jobs),
    [role, user?.id, jobs]
  );

  const activeJobs = useMemo(
    () => scopedJobs.filter((j) => j.stage !== "ready" || !j.completedAt),
    [scopedJobs]
  );

  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const statusParam = searchParams.get("status");

  const jobsWithDetails = useMemo(() => {
    return activeJobs.map((job) => {
      const v = getVehicleById(job.vehicleId);
      const vehicleLabel = v ? `${v.make} ${v.model} (${v.year})` : "—";
      const serviceName = serviceCatalog.find((s) => s.id === job.serviceId)?.name ?? "—";
      const technicianName = job.assignedTechnicianId
        ? technicianNameById.get(job.assignedTechnicianId) ?? "—"
        : "Unassigned";
      return {
        ...job,
        customerName: customerNameById.get(job.customerId) ?? "—",
        vehicleLabel,
        serviceName,
        technicianName,
      };
    });
  }, [activeJobs, customerNameById, technicianNameById, getVehicleById, serviceCatalog]);

  const filteredJobsWithDetails = useMemo(() => {
    const todayUtc = new Date().toISOString().slice(0, 10);
    const isTerminal = (j: (typeof jobsWithDetails)[number]) =>
      j.status === "completed" || j.status === "cancelled";
    const dueKey = (j: (typeof jobsWithDetails)[number]) => j.dueDate.slice(0, 10);

    let list = jobsWithDetails;
    if (filterParam === "due_today") {
      list = list.filter((j) => !isTerminal(j) && dueKey(j) === todayUtc);
    }
    if (filterParam === "overdue") {
      list = list.filter((j) => !isTerminal(j) && dueKey(j) < todayUtc);
    }
    if (statusParam === "in_progress") {
      const inProgressStages = new Set<JobStage>(["intake", "installation", "inspection_final"]);
      list = list.filter(
        (j) =>
          !isTerminal(j) &&
          j.status !== "ready_for_pickup" &&
          inProgressStages.has(j.stage)
      );
    }
    if (statusParam === "ready_for_pickup") {
      list = list.filter((j) => j.status === "ready_for_pickup");
    }
    return list;
  }, [jobsWithDetails, filterParam, statusParam]);

  const onDeleteCustomer = useCallback((customerId: string, customerName: string) => {
    setDeleteDialogCustomerId(customerId);
    setDeleteDialogCustomerName(customerName);
    setDeleteDialogOpen(true);
  }, []);

  const handleMoveJob = useCallback(
    (jobId: string, newStage: JobStage) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;
      if (role === "technician") {
        if (!canTransitionTo(job.stage, newStage, role)) return;
        if (stageRequiresPhoto(newStage) && (!job.mediaIds || job.mediaIds.length === 0)) return;
      }
      updateJobStage(jobId, newStage, undefined, user?.id);
    },
    [jobs, role, user?.id, updateJobStage]
  );

  const kanbanColumns = useMemo(
    () => JOB_STAGES.map((stage) => ({ id: stage, title: formatJobStage(stage) })),
    []
  );

  const isEmpty = filteredJobsWithDetails.length === 0;
  const hasUrlFilter = Boolean(filterParam || statusParam);

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
            {hasUrlFilter
              ? `${filteredJobsWithDetails.length} matching filter`
              : `${activeJobs.length} ${hasPermission("jobs.view_assigned") && !hasPermission("jobs.view_operational") ? "assigned to you" : "vehicles in shop"}`}
          </p>
          {hasUrlFilter && (
            <p className="text-xs text-wraptors-gold/90 mt-1">
              Filtered view —{" "}
              <Link href="/jobs" className="underline hover:text-wraptors-gold">
                Clear filter
              </Link>
            </p>
          )}
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

      {isEmpty ? (
        <Card className="border-wraptors-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-wraptors-gold/10 text-wraptors-gold mb-4">
              <Wrench className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {hasPermission("jobs.view_assigned") && !hasPermission("jobs.view_operational")
                ? "No jobs assigned to you"
                : "No active jobs"}
            </h3>
            <p className="text-sm text-wraptors-muted mt-1 max-w-sm">
              {hasPermission("jobs.create")
                ? "Create a job from a quote or add a new job to get started."
                : "Jobs will appear here when they are created and assigned."}
            </p>
            {hasPermission("jobs.create") && (
              <Button className="mt-6 gap-2" onClick={() => setCreateJobModalOpen(true)}>
                <Plus className="h-4 w-4" /> New job
              </Button>
            )}
          </CardContent>
        </Card>
      ) : activeJobsView === "kanban" ? (
        <JobsKanban
          jobs={filteredJobsWithDetails}
          columns={kanbanColumns}
          onMoveJob={handleMoveJob}
          onDeleteCustomer={hasPermission("customers.delete") ? onDeleteCustomer : undefined}
        />
      ) : (
        <JobsTable jobs={filteredJobsWithDetails} />
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
