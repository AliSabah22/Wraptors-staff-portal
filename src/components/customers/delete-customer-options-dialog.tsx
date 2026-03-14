"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCustomersStore, usePipelineStore, useJobsStore, useQuotesStore } from "@/stores";
import { AlertTriangle } from "lucide-react";

type DeleteCustomerOptionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  customerName: string;
  /** Called after "Delete from system entirely" (e.g. redirect) */
  onDeletedEntirely?: () => void;
};

export function DeleteCustomerOptionsDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  onDeletedEntirely,
}: DeleteCustomerOptionsDialogProps) {
  const removeLeadsByCustomerId = usePipelineStore((s) => s.removeLeadsByCustomerId);
  const removeJobsByCustomerId = useJobsStore((s) => s.removeJobsByCustomerId);
  const removeQuotesByCustomerId = useQuotesStore((s) => s.removeQuotesByCustomerId);
  const deleteCustomer = useCustomersStore((s) => s.deleteCustomer);

  if (!customerId) return null;

  const handlePipelineOnly = () => {
    removeLeadsByCustomerId(customerId);
    onOpenChange(false);
  };

  const handleJobsOnly = () => {
    removeJobsByCustomerId(customerId);
    onOpenChange(false);
  };

  const handleDeleteEntirely = () => {
    removeLeadsByCustomerId(customerId);
    removeJobsByCustomerId(customerId);
    removeQuotesByCustomerId(customerId);
    deleteCustomer(customerId);
    onOpenChange(false);
    onDeletedEntirely?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-wraptors-border bg-wraptors-surface max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <DialogTitle>Delete customer</DialogTitle>
          </div>
          <DialogDescription className="space-y-2 pt-1">
            <p>
              This action can delete the customer <strong className="text-white">{customerName}</strong> forever from the system.
            </p>
            <p className="text-sm">
              Choose what to remove:
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-2">
          <Button
            variant="outline"
            className="justify-start border-amber-500/50 text-amber-200 hover:bg-amber-500/10 hover:text-amber-100"
            onClick={handlePipelineOnly}
          >
            Remove from pipeline only
          </Button>
          <Button
            variant="outline"
            className="justify-start border-amber-500/50 text-amber-200 hover:bg-amber-500/10 hover:text-amber-100"
            onClick={handleJobsOnly}
          >
            Remove from active jobs only
          </Button>
          <Button
            variant="destructive"
            className="justify-start"
            onClick={handleDeleteEntirely}
          >
            Delete from system entirely
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
