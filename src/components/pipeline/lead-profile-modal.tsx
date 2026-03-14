"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePipelineStore } from "@/stores";
import { z } from "zod";
import type { PipelineLead } from "@/types";
import { User, Phone, Mail, FileText } from "lucide-react";

const leadProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact: z.string().min(1, "Contact is required"),
  notes: z.string().optional(),
});

type LeadProfileFormValues = z.infer<typeof leadProfileSchema>;

type LeadProfileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: PipelineLead | null;
};

export function LeadProfileModal({
  open,
  onOpenChange,
  lead,
}: LeadProfileModalProps) {
  const updateLead = usePipelineStore((s) => s.updateLead);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadProfileFormValues>({
    resolver: zodResolver(leadProfileSchema),
    defaultValues: { name: "", contact: "", notes: "" },
  });

  useEffect(() => {
    if (lead && open) {
      reset({
        name: lead.name,
        contact: lead.contact,
        notes: lead.notes ?? "",
      });
    }
  }, [lead, open, reset]);

  const onSubmit = (data: LeadProfileFormValues) => {
    if (!lead) return;
    updateLead(lead.id, {
      name: data.name.trim(),
      contact: data.contact.trim(),
      notes: data.notes?.trim() || undefined,
    });
    onOpenChange(false);
  };

  if (!lead) return null;

  const isEmail = lead.contact.includes("@");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-wraptors-border bg-wraptors-surface">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-wraptors-gold" />
            Lead profile
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-wraptors-muted pt-1">
          This lead isn’t linked to a customer yet. Edit details below; link to a customer from the full profile later.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lead-name">Name</Label>
                <Input
                  id="lead-name"
                  placeholder="Full name"
                  {...register("name")}
                  className="bg-wraptors-charcoal border-wraptors-border"
                />
                {errors.name && (
                  <p className="text-xs text-red-400">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-contact">
                  {isEmail ? "Email" : "Phone"}
                </Label>
                <Input
                  id="lead-contact"
                  type={isEmail ? "email" : "tel"}
                  placeholder={isEmail ? "email@example.com" : "+1 (555) 000-0000"}
                  {...register("contact")}
                  className="bg-wraptors-charcoal border-wraptors-border"
                />
                {errors.contact && (
                  <p className="text-xs text-red-400">{errors.contact.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-wraptors-gold" /> Notes
                </CardTitle>
                <Textarea
                  placeholder="Notes…"
                  rows={3}
                  {...register("notes")}
                  className="bg-wraptors-charcoal border-wraptors-border resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="pt-2 border-t border-wraptors-border/50">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
