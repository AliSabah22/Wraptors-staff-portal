"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { useCustomersStore, useUIStore } from "@/stores";
import { createCustomerSchema, type CreateCustomerFormValues } from "@/lib/validations";
import { checkDuplicateCustomer, type DuplicateCandidate } from "@/lib/duplicate-warnings";
import { mapDbCustomerRowToCustomer } from "@/lib/server-data/hydration-mappers";
import { cn } from "@/lib/utils";
import { Check, Loader2, UserPlus, Car, FileText, Briefcase } from "lucide-react";

type AddCustomerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddCustomerModal({ open, onOpenChange }: AddCustomerModalProps) {
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [duplicateCandidate, setDuplicateCandidate] = useState<DuplicateCandidate | null>(null);
  const [pendingFormData, setPendingFormData] = useState<CreateCustomerFormValues | null>(null);
  const addCustomer = useCustomersStore((s) => s.addCustomer);
  const customers = useCustomersStore((s) => s.customers);
  const setAddCustomerModalOpen = useUIStore((s) => s.setAddCustomerModalOpen);
  const setCreateQuoteModalOpen = useUIStore((s) => s.setCreateQuoteModalOpen);
  const setCreateJobModalOpen = useUIStore((s) => s.setCreateJobModalOpen);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      notes: "",
    },
  });

  const closeAndReset = () => {
    setCreatedId(null);
    setDuplicateCandidate(null);
    setPendingFormData(null);
    reset();
    setAddCustomerModalOpen(false);
    onOpenChange(false);
  };

  const onSubmit = async (data: CreateCustomerFormValues) => {
    const dup = checkDuplicateCustomer(customers, { phone: data.phone, email: data.email });
    if (dup) {
      setDuplicateCandidate(dup);
      setPendingFormData(data);
      return;
    }
    await doCreateCustomer(data);
  };

  const doCreateCustomer = async (data: CreateCustomerFormValues) => {
    setDuplicateCandidate(null);
    setPendingFormData(null);
    clearErrors();

    const full_name = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();
    const emailTrim = data.email?.trim() ?? "";
    if (!emailTrim) {
      setError("email", {
        type: "manual",
        message: "Email is required",
      });
      return;
    }

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name,
          email: emailTrim,
          phone: data.phone.trim() || null,
          membership_status: "none" as const,
          notes: data.notes?.trim() || null,
          source: null,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        data?: Record<string, unknown>;
      };

      if (!res.ok || json.success === false) {
        const msg = typeof json.error === "string" ? json.error : "Failed to create customer";
        if (msg.includes("already exists")) {
          setError("email", { type: "manual", message: msg });
        } else {
          setError("phone", { type: "manual", message: msg });
        }
        return;
      }

      if (!json.data || typeof json.data !== "object") {
        setError("phone", { type: "manual", message: "Invalid response from server" });
        return;
      }

      const customer = mapDbCustomerRowToCustomer(json.data);
      addCustomer(customer);
      setCreatedId(customer.id);
    } catch {
      setError("phone", { type: "manual", message: "Network error — please try again" });
    }
  };

  const showSuccess = createdId != null;
  const showDuplicateWarning = duplicateCandidate != null && pendingFormData != null;

  const preventClose = showSuccess || showDuplicateWarning;

  return (
    <Dialog open={open} onOpenChange={(o) => !preventClose && onOpenChange(o)}>
      <DialogContent
        className={cn(
          "max-w-md border-wraptors-border bg-wraptors-surface",
          "flex max-h-[min(90vh,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden p-0"
        )}
        onPointerDownOutside={(e) => preventClose && e.preventDefault()}
      >
        {showSuccess ? (
          <>
            <DialogHeader className="shrink-0 px-6 pt-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-wraptors-gold/20 text-wraptors-gold">
                <Check className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center">Customer added</DialogTitle>
              <DialogDescription className="text-center">
                Choose a next step or close to continue.
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="flex flex-col flex-wrap gap-2 sm:flex-row sm:justify-center">
                <Button asChild className="gap-2">
                  <Link href={`/customers/${createdId ?? ""}`} onClick={closeAndReset}>
                    View customer
                  </Link>
                </Button>
                <Button variant="outline" className="gap-2" asChild>
                  <Link href={createdId ? `/customers/${createdId}` : "/customers"} onClick={closeAndReset}>
                    <Car className="h-4 w-4" />
                    Add vehicle
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    closeAndReset();
                    setCreateQuoteModalOpen(true);
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Create quote
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    closeAndReset();
                    setCreateJobModalOpen(true);
                  }}
                >
                  <Briefcase className="h-4 w-4" />
                  Create job
                </Button>
                <Button variant="ghost" onClick={closeAndReset}>
                  Done
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="shrink-0 px-6 pt-6">
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-wraptors-gold" />
                Add customer
              </DialogTitle>
              <DialogDescription>
                Create a new customer profile. Required fields are marked.
              </DialogDescription>
            </DialogHeader>
            {showDuplicateWarning ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                  <p className="text-sm text-amber-200">
                    A customer with the same phone or email already exists:{" "}
                    <strong className="text-white">{duplicateCandidate!.name}</strong>
                  </p>
                </div>
                <DialogFooter className="shrink-0 gap-2 border-t border-wraptors-border/50 px-6 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDuplicateCandidate(null);
                      setPendingFormData(null);
                    }}
                  >
                    Back
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/customers/${duplicateCandidate!.id}`} onClick={closeAndReset}>
                      View existing
                    </Link>
                  </Button>
                  <Button onClick={() => pendingFormData && void doCreateCustomer(pendingFormData)}>
                    Create anyway
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-2">
                  <div className="space-y-6">
                    <div>
                      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-wraptors-muted">
                        Contact information
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First name</Label>
                          <Input id="firstName" placeholder="James" {...register("firstName")} />
                          {errors.firstName && (
                            <p className="text-xs text-red-400">{errors.firstName.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last name</Label>
                          <Input id="lastName" placeholder="Smith" {...register("lastName")} />
                          {errors.lastName && (
                            <p className="text-xs text-red-400">{errors.lastName.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Label htmlFor="phone">
                          Phone <span className="text-wraptors-gold">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          {...register("phone")}
                        />
                        {errors.phone && (
                          <p className="text-xs text-red-400">{errors.phone.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-wraptors-border/50 pt-4">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-wraptors-muted">Notes</p>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email (optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="james@example.com"
                          {...register("email")}
                        />
                        {errors.email && (
                          <p className="text-xs text-red-400">{errors.email.message}</p>
                        )}
                      </div>
                      <div className="mt-4 space-y-2">
                        <Label htmlFor="notes">Internal notes (optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Preferred contact method, VIP, etc."
                          rows={2}
                          {...register("notes")}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-0 shrink-0 gap-2 border-t border-wraptors-border/50 px-6 py-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="gap-2">
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Add customer
                  </Button>
                </DialogFooter>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
