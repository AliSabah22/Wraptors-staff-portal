"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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
import { useQuotesStore, useCustomersStore, useServicesStore, usePipelineStore } from "@/stores";
import { createQuoteSchema, type CreateQuoteFormValues } from "@/lib/validations";
import { SHOP_ID } from "@/lib/constants";
import type { QuoteRequest, QuoteSource, PipelineLead } from "@/types";
import { Check, FileText, Loader2 } from "lucide-react";

const SOURCE_OPTIONS: { value: QuoteSource; label: string }[] = [
  { value: "walk_in", label: "Walk-in" },
  { value: "phone", label: "Phone" },
  { value: "web", label: "Website" },
  { value: "in_person", label: "In-person" },
  { value: "mobile_app", label: "Mobile app" },
];

type CreateQuoteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateQuoteModal({ open, onOpenChange }: CreateQuoteModalProps) {
  const [createdId, setCreatedId] = useState<string | null>(null);
  const addQuote = useQuotesStore((s) => s.addQuote);
  const addLead = usePipelineStore((s) => s.addLead);
  const customers = useCustomersStore((s) => s.customers);
  const services = useServicesStore((s) => s.services);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateQuoteFormValues>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      customerId: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      vehicleMake: "",
      vehicleModel: "",
      vehicleYear: undefined,
      vehicleColor: "",
      serviceIds: [],
      notes: "",
      estimatedAmount: undefined,
      source: "walk_in",
    },
  });

  const customerId = watch("customerId");

  useEffect(() => {
    if (!customerId) return;
    const c = customers.find((x) => x.id === customerId);
    if (c) {
      setValue("customerName", c.name);
      setValue("customerPhone", c.phone);
      setValue("customerEmail", c.email ?? "");
    }
  }, [customerId, customers, setValue]);

  const onSuccess = () => {
    setCreatedId(null);
    reset();
    onOpenChange(false);
  };

  const onSubmit = (data: CreateQuoteFormValues) => {
    const now = new Date().toISOString();
    const id = `quote_${Date.now()}`;
    const parts = [
      data.vehicleYear && String(data.vehicleYear),
      data.vehicleMake,
      data.vehicleModel,
      data.vehicleColor,
    ].filter(Boolean);
    const vehicleDescription = parts.length > 0 ? parts.join(" ") : undefined;

    const quote: QuoteRequest = {
      id,
      shopId: SHOP_ID,
      customerId: data.customerId?.trim() || undefined,
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone.trim(),
      customerEmail: data.customerEmail?.trim() || undefined,
      vehicleDescription,
      vehicleMake: data.vehicleMake?.trim(),
      vehicleModel: data.vehicleModel?.trim(),
      vehicleYear: data.vehicleYear,
      vehicleColor: data.vehicleColor?.trim(),
      serviceIds: data.serviceIds,
      status: "new",
      estimatedAmount: data.estimatedAmount,
      notes: data.notes?.trim(),
      source: data.source,
      createdAt: now,
      updatedAt: now,
    };
    addQuote(quote);

    // Add pipeline lead so the quote value shows in the pipeline
    const leadId = `lead_quote_${Date.now()}`;
    const lead: PipelineLead = {
      id: leadId,
      shopId: SHOP_ID,
      quoteRequestId: id,
      customerId: quote.customerId,
      name: quote.customerName,
      contact: quote.customerPhone || quote.customerEmail || "—",
      stage: "lead",
      value: data.estimatedAmount != null ? Number(data.estimatedAmount) : undefined,
      notes: quote.notes,
      createdAt: now,
      updatedAt: now,
    };
    addLead(lead);

    setCreatedId(id);
  };

  const showSuccess = createdId != null;

  return (
    <Dialog open={open} onOpenChange={(o) => !showSuccess && onOpenChange(o)}>
      <DialogContent
        className="max-w-lg border-wraptors-border bg-wraptors-surface max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => showSuccess && e.preventDefault()}
      >
        {showSuccess ? (
          <>
            <DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-wraptors-gold/20 text-wraptors-gold">
                <Check className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center">Quote request created</DialogTitle>
              <DialogDescription className="text-center">
                It’s in the list with status “New”. You can view or update it from Quote Requests.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:justify-center pt-4">
              <Button variant="outline" onClick={onSuccess}>
                Done
              </Button>
              <Button asChild className="gap-2">
                <Link href={`/quote-requests/${createdId}`} onClick={onSuccess}>
                  View quote
                </Link>
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-wraptors-gold" />
                Create quote request
              </DialogTitle>
              <DialogDescription>
                Customer info, vehicle, and requested services. Link to an existing customer or enter manually.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-wraptors-muted mb-3">Customer</p>
              <div className="space-y-2">
                <Label htmlFor="customerId">Existing customer (optional)</Label>
                <select
                  id="customerId"
                  className="flex h-10 w-full rounded-lg border border-wraptors-border bg-wraptors-charcoal px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-wraptors-gold/50"
                  {...register("customerId")}
                >
                  <option value="">— Select existing client or enter manually below —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-wraptors-muted">
                  Choose a client to send the quote to; name, phone and email will fill in automatically.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer name</Label>
                  <Input id="customerName" placeholder="Full name" {...register("customerName")} />
                  {errors.customerName && (
                    <p className="text-xs text-red-400">{errors.customerName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input id="customerPhone" type="tel" placeholder="+1 (555) 000-0000" {...register("customerPhone")} />
                  {errors.customerPhone && (
                    <p className="text-xs text-red-400">{errors.customerPhone.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email (optional)</Label>
                <Input id="customerEmail" type="email" placeholder="email@example.com" {...register("customerEmail")} />
              </div>
              </div>

              <div className="border-t border-wraptors-border/50 pt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-wraptors-muted mb-3">Vehicle</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleMake">Make</Label>
                    <Input id="vehicleMake" placeholder="BMW" {...register("vehicleMake")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel">Model</Label>
                    <Input id="vehicleModel" placeholder="M4" {...register("vehicleModel")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleYear">Year</Label>
                    <Input id="vehicleYear" type="number" placeholder="2024" {...register("vehicleYear")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleColor">Color (optional)</Label>
                    <Input id="vehicleColor" placeholder="Black" {...register("vehicleColor")} />
                  </div>
                </div>
              </div>

              <div className="border-t border-wraptors-border/50 pt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-wraptors-muted mb-3">Service request</p>
                <div className="space-y-2">
                  <Label>Services (select at least one)</Label>
                  <Controller
                    name="serviceIds"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto rounded-lg border border-wraptors-border bg-wraptors-charcoal p-3">
                        {services.filter((s) => s.active).map((s) => (
                          <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.value.includes(s.id)}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...field.value, s.id]
                                  : field.value.filter((id) => id !== s.id);
                                field.onChange(next);
                              }}
                              className="rounded border-wraptors-border bg-wraptors-charcoal text-wraptors-gold focus:ring-wraptors-gold/50"
                            />
                            <span className="text-sm text-white">{s.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  />
                  {errors.serviceIds && (
                    <p className="text-xs text-red-400">{errors.serviceIds.message}</p>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  <Label htmlFor="estimatedAmount">Est. value ($, optional)</Label>
                  <Input
                    id="estimatedAmount"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    {...register("estimatedAmount")}
                  />
                </div>
              </div>

              <div className="border-t border-wraptors-border/50 pt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-wraptors-muted mb-3">Details</p>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <select
                  id="source"
                  className="flex h-10 w-full rounded-lg border border-wraptors-border bg-wraptors-charcoal px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-wraptors-gold/50"
                  {...register("source")}
                >
                  {SOURCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 mt-3">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea id="notes" placeholder="Request details, urgency…" rows={2} {...register("notes")} />
              </div>
              </div>

              <DialogFooter className="gap-2 pt-4 border-t border-wraptors-border/50 mt-6">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Create quote request
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
