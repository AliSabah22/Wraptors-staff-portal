"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mockVehicles } from "@/data/mock";
import { useCustomersStore, usePipelineStore } from "@/stores";
import { updateCustomerSchema, type UpdateCustomerFormValues } from "@/lib/validations";
import { Car, User, Phone, Mail, FileText } from "lucide-react";

type CustomerProfileEditModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
};

export function CustomerProfileEditModal({
  open,
  onOpenChange,
  customerId,
}: CustomerProfileEditModalProps) {
  const customer = useCustomersStore((s) =>
    customerId ? s.getCustomerById(customerId) : undefined
  );
  const updateCustomer = useCustomersStore((s) => s.updateCustomer);
  const leads = usePipelineStore((s) => s.leads);
  const updateLead = usePipelineStore((s) => s.updateLead);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCustomerFormValues>({
    resolver: zodResolver(updateCustomerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (customer && open) {
      reset({
        name: customer.name,
        phone: customer.phone,
        email: customer.email ?? "",
        notes: customer.notes ?? "",
      });
    }
  }, [customer, open, reset]);

  const onSubmit = (data: UpdateCustomerFormValues) => {
    if (!customerId) return;
    updateCustomer(customerId, {
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    });
    const contact = data.phone.trim() || data.email?.trim() || "—";
    leads.forEach((lead) => {
      if (lead.customerId === customerId) {
        updateLead(lead.id, { name: data.name.trim(), contact });
      }
    });
    onOpenChange(false);
  };

  if (!customerId) return null;
  const vehicles = mockVehicles.filter((v) => v.customerId === customerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-wraptors-border bg-wraptors-surface">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-wraptors-gold" />
            {customer?.name ?? "Customer profile"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Contact (editable)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  placeholder="Full name"
                  {...register("name")}
                  className="bg-wraptors-charcoal border-wraptors-border"
                />
                {errors.name && (
                  <p className="text-xs text-red-400">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  {...register("phone")}
                  className="bg-wraptors-charcoal border-wraptors-border"
                />
                {errors.phone && (
                  <p className="text-xs text-red-400">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email (optional)</Label>
                <Input
                  id="profile-email"
                  type="email"
                  placeholder="email@example.com"
                  {...register("email")}
                  className="bg-wraptors-charcoal border-wraptors-border"
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-wraptors-gold" /> Notes (editable)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Notes about this customer…"
                rows={3}
                {...register("notes")}
                className="bg-wraptors-charcoal border-wraptors-border resize-none"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Car className="h-4 w-4 text-wraptors-gold" /> Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 ? (
                <p className="text-sm text-wraptors-muted">No vehicles on file.</p>
              ) : (
                <ul className="space-y-2">
                  {vehicles.map((v) => (
                    <li
                      key={v.id}
                      className="rounded-lg border border-wraptors-border p-3 text-sm"
                    >
                      <p className="font-medium">
                        {v.year} {v.make} {v.model}
                      </p>
                      <p className="text-wraptors-muted text-xs">
                        {v.color ?? "—"} · {v.plate ?? "No plate"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-wraptors-muted mt-2">
                To add or edit vehicles, use the full customer profile.
              </p>
            </CardContent>
          </Card>

          <DialogFooter className="flex flex-wrap gap-2 sm:justify-between pt-2 border-t border-wraptors-border/50">
            <Button type="button" variant="outline" asChild>
              <Link href={`/customers/${customerId}`} onClick={() => onOpenChange(false)}>
                Open full profile
              </Link>
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
