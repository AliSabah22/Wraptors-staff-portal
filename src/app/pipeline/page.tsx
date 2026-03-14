"use client";

import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { usePipelineStore, useUIStore } from "@/stores";
import { PipelineKanban } from "@/components/pipeline/pipeline-kanban";
import { CustomerProfileEditModal } from "@/components/customers/customer-profile-edit-modal";
import { LeadProfileModal } from "@/components/pipeline/lead-profile-modal";
import { DeleteCustomerOptionsDialog } from "@/components/customers/delete-customer-options-dialog";
import { usePermissions } from "@/hooks/usePermissions";
import type { PipelineStage, PipelineLead } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, GitBranch } from "lucide-react";

const PIPELINE_STAGES: PipelineStage[] = [
  "lead",
  "consultation",
  "quote_sent",
  "follow_up",
  "booked",
  "lost",
];

function stageTitle(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function PipelinePage() {
  const [profileLead, setProfileLead] = useState<PipelineLead | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDialogCustomerId, setDeleteDialogCustomerId] = useState<string | null>(null);
  const [deleteDialogCustomerName, setDeleteDialogCustomerName] = useState("");

  const setAddCustomerModalOpen = useUIStore((s) => s.setAddCustomerModalOpen);
  const leads = usePipelineStore((s) => s.leads);
  const updateLeadStage = usePipelineStore((s) => s.updateLeadStage);
  const removeLead = usePipelineStore((s) => s.removeLead);
  const { hasPermission } = usePermissions();

  const onDeleteLead = useCallback((lead: PipelineLead) => {
    if (lead.customerId) {
      setDeleteDialogCustomerId(lead.customerId);
      setDeleteDialogCustomerName(lead.name);
      setDeleteDialogOpen(true);
    } else {
      removeLead(lead.id);
    }
  }, [removeLead]);

  const columns = useMemo(
    () =>
      PIPELINE_STAGES.map((stage) => ({
        id: stage,
        title: stageTitle(stage),
      })),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-wraptors-muted mt-0.5">Sales pipeline — drag leads between stages</p>
        </div>
        <Button className="gap-2" onClick={() => setAddCustomerModalOpen(true)}>
          <UserPlus className="h-4 w-4" />
          New customer
        </Button>
      </div>

      {leads.length === 0 ? (
        <Card className="border-wraptors-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-wraptors-gold/10 text-wraptors-gold mb-4">
              <GitBranch className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-white">No leads in pipeline</h3>
            <p className="text-sm text-wraptors-muted mt-1 max-w-sm">
              Add a customer to get started. New leads will appear here and can be moved through stages.
            </p>
            <Button className="mt-6 gap-2" onClick={() => setAddCustomerModalOpen(true)}>
              <UserPlus className="h-4 w-4" /> New customer
            </Button>
          </CardContent>
        </Card>
      ) : (
      <PipelineKanban
        leads={leads}
        columns={columns}
        onMoveLead={updateLeadStage}
        onDeleteLead={hasPermission("customers.delete") ? onDeleteLead : undefined}
        onViewProfile={setProfileLead}
      />
      )}

      {profileLead && profileLead.customerId != null && (
        <CustomerProfileEditModal
          open
          onOpenChange={(open) => !open && setProfileLead(null)}
          customerId={profileLead.customerId}
        />
      )}
      {profileLead && profileLead.customerId == null && (
        <LeadProfileModal
          open
          onOpenChange={(open) => !open && setProfileLead(null)}
          lead={profileLead}
        />
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
