"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useServicesStore } from "@/stores";
import { createServiceSchema, type CreateServiceFormValues } from "@/lib/validations";
import { SHOP_ID } from "@/lib/constants";
import type { Service, ServiceCategory } from "@/types";
import { Check, Loader2, Package } from "lucide-react";

const SERVICE_CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: "full_wrap", label: "Full Wrap" },
  { value: "ppf", label: "PPF" },
  { value: "ceramic_coating", label: "Ceramic Coating" },
  { value: "tint", label: "Tint" },
  { value: "chrome_delete", label: "Chrome Delete" },
  { value: "detailing", label: "Detailing" },
  { value: "custom", label: "Custom Work" },
];

type AddServiceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddServiceModal({ open, onOpenChange }: AddServiceModalProps) {
  const [success, setSuccess] = useState(false);
  const addService = useServicesStore((s) => s.addService);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateServiceFormValues>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      name: "",
      category: "full_wrap",
      description: "",
      estimatedHours: undefined,
      estimatedPriceMin: undefined,
      estimatedPriceMax: undefined,
      estimatedPrice: 0,
      active: true,
      featured: false,
    },
  });

  const onClose = () => {
    setSuccess(false);
    reset();
    onOpenChange(false);
  };

  const onSubmit = (data: CreateServiceFormValues) => {
    const now = new Date().toISOString();
    const id = `svc_${Date.now()}`;
    const service: Service = {
      id,
      shopId: SHOP_ID,
      name: data.name.trim(),
      category: data.category as ServiceCategory,
      description: data.description.trim(),
      estimatedPrice: data.estimatedPrice ?? 0,
      estimatedPriceMin: data.estimatedPriceMin,
      estimatedPriceMax: data.estimatedPriceMax,
      estimatedHours: data.estimatedHours,
      active: data.active,
      featured: data.featured,
      createdAt: now,
      updatedAt: now,
    };
    addService(service);
    setSuccess(true);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !success && onOpenChange(o)}>
      <DialogContent
        className="max-w-md border-wraptors-border bg-wraptors-surface"
        onPointerDownOutside={(e) => success && e.preventDefault()}
      >
        {success ? (
          <>
            <DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-wraptors-gold/20 text-wraptors-gold">
                <Check className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center">Service added</DialogTitle>
              <DialogDescription className="text-center">
                It’s now available in your services list and for quote requests.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center pt-4">
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-wraptors-gold" />
                Add service
              </DialogTitle>
              <DialogDescription>
                Create a new service offering. It will appear in quotes and job creation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Service name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Full Wrap"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-red-400">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-lg border border-wraptors-border bg-wraptors-charcoal px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-wraptors-gold/50"
                  {...register("category")}
                >
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-xs text-red-400">{errors.category.message}</p>
                )}
              </div>
              <div className="border-t border-wraptors-border/50 pt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-wraptors-muted mb-3">Pricing & availability</p>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description for quotes and customers"
                  rows={2}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-xs text-red-400">{errors.description.message}</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedPrice">Est. price ($)</Label>
                  <Input
                    id="estimatedPrice"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    {...register("estimatedPrice")}
                  />
                  {errors.estimatedPrice && (
                    <p className="text-xs text-red-400">{errors.estimatedPrice.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedPriceMin">Min ($)</Label>
                  <Input
                    id="estimatedPriceMin"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="—"
                    {...register("estimatedPriceMin")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedPriceMax">Max ($)</Label>
                  <Input
                    id="estimatedPriceMax"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="—"
                    {...register("estimatedPriceMax")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Est. hours (optional)</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min={0}
                  step={0.5}
                  placeholder="—"
                  {...register("estimatedHours")}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-wraptors-border bg-wraptors-charcoal text-wraptors-gold focus:ring-wraptors-gold/50"
                    {...register("active")}
                  />
                  <span className="text-sm text-wraptors-muted-light">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-wraptors-border bg-wraptors-charcoal text-wraptors-gold focus:ring-wraptors-gold/50"
                    {...register("featured")}
                  />
                  <span className="text-sm text-wraptors-muted-light">Featured</span>
                </label>
              </div>
              </div>
              <DialogFooter className="gap-2 pt-4 border-t border-wraptors-border/50 mt-6">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                  Add service
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
