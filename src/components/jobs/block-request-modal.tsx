"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BlockTypeKey, BlockRequestDetails } from "@/types";
import {
  PAYMENT_STAGE_OPTIONS,
  MATERIAL_ISSUE_OPTIONS,
  REWORK_REASON_OPTIONS,
} from "@/lib/job-workflow/config";
import { BLOCK_MODAL_TITLES, BLOCK_MODAL_DESCRIPTIONS } from "@/lib/job-workflow/blocker-copy";
import { AlertCircle } from "lucide-react";

export interface BlockRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockType: BlockTypeKey;
  jobId: string;
  onSubmit: (details: BlockRequestDetails) => void;
}

export function BlockRequestModal({
  open,
  onOpenChange,
  blockType,
  jobId,
  onSubmit,
}: BlockRequestModalProps) {
  const [partName, setPartName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [estimatedArrival, setEstimatedArrival] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [paymentStage, setPaymentStage] = useState("");
  const [issueType, setIssueType] = useState("");
  const [reworkReason, setReworkReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPartName("");
      setSupplier("");
      setEstimatedArrival("");
      setRequestReason("");
      setRequestNote("");
      setPaymentStage("");
      setIssueType("");
      setReworkReason("");
      setNotes("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (blockType === "waiting_for_parts") {
      if (!partName.trim()) {
        setError("Part name is required.");
        return;
      }
      onSubmit({
        type: "waiting_for_parts",
        partName: partName.trim(),
        supplier: supplier.trim() || undefined,
        estimatedArrival: estimatedArrival.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else if (blockType === "waiting_for_approval") {
      if (!requestReason.trim()) {
        setError("Request reason is required.");
        return;
      }
      onSubmit({
        type: "waiting_for_approval",
        requestReason: requestReason.trim(),
        requestNote: requestNote.trim() || undefined,
      });
    } else if (blockType === "waiting_for_payment") {
      if (!paymentStage) {
        setError("Payment stage is required.");
        return;
      }
      onSubmit({
        type: "waiting_for_payment",
        paymentStage,
        notes: notes.trim() || undefined,
      });
    } else if (blockType === "material_issue") {
      if (!issueType) {
        setError("Issue type is required.");
        return;
      }
      onSubmit({
        type: "material_issue",
        issueType,
        notes: notes.trim() || undefined,
      });
    } else if (blockType === "rework_needed") {
      if (!reworkReason) {
        setError("Rework reason is required.");
        return;
      }
      onSubmit({
        type: "rework_needed",
        reworkReason,
        notes: notes.trim() || undefined,
      });
    }
    onOpenChange(false);
  };

  const modalTitle = BLOCK_MODAL_TITLES[blockType];
  const modalDescription = BLOCK_MODAL_DESCRIPTIONS[blockType];
  const isApproval = blockType === "waiting_for_approval";
  const submitLabel = isApproval ? "Submit approval request" : "Submit block request";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-wraptors-border bg-wraptors-surface max-w-md">
        <DialogHeader>
          <DialogTitle className="text-wraptors-gold">{modalTitle}</DialogTitle>
          <DialogDescription className="text-wraptors-muted leading-relaxed">
            {modalDescription}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {blockType === "waiting_for_parts" && (
            <>
              <p className="text-xs font-medium text-wraptors-muted uppercase tracking-wider">Request details</p>
              <div>
                <Label className="text-wraptors-muted">Part needed *</Label>
                <p className="text-xs text-wraptors-muted mt-0.5">Name or description of the part holding the job</p>
                <Input
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  placeholder="e.g. Front bumper PPF kit"
                  className="mt-1 border-wraptors-border bg-wraptors-black/50"
                />
              </div>
              <div>
                <Label className="text-wraptors-muted">Supplier</Label>
                <Input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="e.g. XPEL"
                  className="mt-1 border-wraptors-border bg-wraptors-black/50"
                />
              </div>
              <div>
                <Label className="text-wraptors-muted">Estimated arrival</Label>
                <Input
                  value={estimatedArrival}
                  onChange={(e) => setEstimatedArrival(e.target.value)}
                  placeholder="e.g. Tomorrow"
                  className="mt-1 border-wraptors-border bg-wraptors-black/50"
                />
              </div>
              <div>
                <Label className="text-wraptors-muted">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Current kit damaged during install"
                  className="mt-1 border-wraptors-border bg-wraptors-black/50 min-h-[80px]"
                />
              </div>
            </>
          )}

          {blockType === "waiting_for_approval" && (
            <>
              <p className="text-xs font-medium text-wraptors-muted uppercase tracking-wider">Approval request</p>
              <div>
                <Label className="text-wraptors-muted">Reason for approval *</Label>
                <p className="text-xs text-wraptors-muted mt-0.5">Visible to CEO when they review the request</p>
                <Input
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="e.g. Need approval before rework"
                  className="mt-1 border-wraptors-border bg-wraptors-black/50"
                />
              </div>
              <div>
                <Label className="text-wraptors-muted">Additional context</Label>
                <Textarea
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="Optional note for CEO"
                  className="mt-1 border-wraptors-border bg-wraptors-black/50 min-h-[80px]"
                />
              </div>
            </>
          )}

          {blockType === "waiting_for_payment" && (
            <>
              <p className="text-xs font-medium text-wraptors-muted uppercase tracking-wider">Payment details</p>
              <div>
                <Label className="text-wraptors-muted">Payment stage *</Label>
                <p className="text-xs text-wraptors-muted mt-0.5">What payment is required before work can continue</p>
                <Select value={paymentStage} onValueChange={setPaymentStage}>
                  <SelectTrigger className="mt-1 border-wraptors-border bg-wraptors-black/50">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STAGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-wraptors-muted">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 border-wraptors-border bg-wraptors-black/50 min-h-[80px]"
                />
              </div>
            </>
          )}

          {blockType === "material_issue" && (
            <>
              <p className="text-xs font-medium text-wraptors-muted uppercase tracking-wider">Issue details</p>
              <div>
                <Label className="text-wraptors-muted">Issue type *</Label>
                <Select value={issueType} onValueChange={setIssueType}>
                  <SelectTrigger className="mt-1 border-wraptors-border bg-wraptors-black/50">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_ISSUE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-wraptors-muted">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 border-wraptors-border bg-wraptors-black/50 min-h-[80px]"
                />
              </div>
            </>
          )}

          {blockType === "rework_needed" && (
            <>
              <p className="text-xs font-medium text-wraptors-muted uppercase tracking-wider">Rework details</p>
              <div>
                <Label className="text-wraptors-muted">Rework reason *</Label>
                <Select value={reworkReason} onValueChange={setReworkReason}>
                  <SelectTrigger className="mt-1 border-wraptors-border bg-wraptors-black/50">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {REWORK_REASON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-wraptors-muted">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 border-wraptors-border bg-wraptors-black/50 min-h-[80px]"
                />
              </div>
            </>
          )}

          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-wraptors-border">
              Cancel
            </Button>
            <Button type="submit" className="bg-wraptors-gold text-wraptors-black hover:bg-wraptors-gold/90">
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
