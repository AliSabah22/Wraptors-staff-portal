"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { usePipelineStore, useUIStore } from "@/stores";
import { PipelineKanban } from "@/components/pipeline/pipeline-kanban";
import { CustomerProfileEditModal } from "@/components/customers/customer-profile-edit-modal";
import { LeadProfileModal } from "@/components/pipeline/lead-profile-modal";
import { DeleteCustomerOptionsDialog } from "@/components/customers/delete-customer-options-dialog";
import { usePermissions } from "@/hooks/usePermissions";
import type { PipelineStage, PipelineLead } from "@/types";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

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

  const onDeleteLead = (lead: PipelineLead) => {
    if (lead.customerId) {
      setDeleteDialogCustomerId(lead.customerId);
      setDeleteDialogCustomerName(lead.name);
      setDeleteDialogOpen(true);
    } else {
      removeLead(lead.id);
    }
  };

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

      <PipelineKanban
        leads={leads}
        columns={columns}
        onMoveLead={(leadId, newStage) => updateLeadStage(leadId, newStage)}
        onDeleteLead={hasPermission("customers.delete") ? onDeleteLead : undefined}
        onViewProfile={setProfileLead}
      />

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
