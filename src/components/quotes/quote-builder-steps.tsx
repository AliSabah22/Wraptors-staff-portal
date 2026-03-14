"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuoteBuilderStore } from "@/stores/quote-builder";
import { useCustomersStore, useVehiclesStore, usePipelineStore } from "@/stores";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { formatCurrency } from "@/lib/utils";
import { SHOP_ID } from "@/lib/constants";
import type { VehicleSnapshot, QuoteTier, VehicleClassMultiplier, QuoteTemplate, QuoteAddon } from "@/types";
import type { Customer, Vehicle } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronRight, Lock, AlertTriangle } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  ppf: "PPF",
  wrap: "Wrap",
  tint: "Tint",
  coating: "Coating",
  detailing: "Detailing",
};

type BuilderStep = 1 | 2 | 3 | 4 | 5;

export interface QuoteBuilderFormState {
  customerId: string | null;
  pipelineLeadId: string | null;
  vehicleId: string | null;
  vehicleSnapshot: VehicleSnapshot | null;
  vehicleClassMultiplierId: string;
  selectedServices: Array<{ templateId: string; tier: QuoteTier }>;
  selectedAddons: string[];
  notes: string;
  validUntil: string;
  discountAmount: number;
}

const defaultFormState = (): QuoteBuilderFormState => ({
  customerId: null,
  pipelineLeadId: null,
  vehicleId: null,
  vehicleSnapshot: null,
  vehicleClassMultiplierId: "",
  selectedServices: [],
  selectedAddons: [],
  notes: "",
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  discountAmount: 0,
});

type QuoteBuilderStepsProps = {
  mode: "new" | "edit";
  existingQuoteId?: string;
};

export function QuoteBuilderSteps({ mode, existingQuoteId }: QuoteBuilderStepsProps) {
  const router = useRouter();
  const { user, role } = useCurrentUser();
  const { hasPermission } = usePermissions();

  const getTemplates = useQuoteBuilderStore((s) => s.getTemplates);
  const getMultipliers = useQuoteBuilderStore((s) => s.getMultipliers);
  const getAddons = useQuoteBuilderStore((s) => s.getAddons);
  const createQuote = useQuoteBuilderStore((s) => s.createQuote);
  const updateQuote = useQuoteBuilderStore((s) => s.updateQuote);
  const sendQuote = useQuoteBuilderStore((s) => s.sendQuote);
  const getQuoteById = useQuoteBuilderStore((s) => s.getQuoteById);
  const getLineItemsByQuoteId = useQuoteBuilderStore((s) => s.getLineItemsByQuoteId);

  const customers = useCustomersStore((s) => s.customers);
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const addCustomer = useCustomersStore((s) => s.addCustomer);
  const addVehicle = useVehiclesStore((s) => s.addVehicle);
  const addVehicleToCustomer = useCustomersStore((s) => s.addVehicleToCustomer);
  const leads = usePipelineStore((s) => s.leads);
  const getLeadById = usePipelineStore((s) => s.getLeadById);

  const [step, setStep] = useState<BuilderStep>(1);
  const [form, setForm] = useState<QuoteBuilderFormState>(defaultFormState);
  const leadName = form.pipelineLeadId ? getLeadById(form.pipelineLeadId)?.name : null;
  const [customerSearch, setCustomerSearch] = useState("");
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [saveAndSend, setSaveAndSend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit" && existingQuoteId) {
      const q = getQuoteById(existingQuoteId);
      const lineItems = getLineItemsByQuoteId(existingQuoteId);
      if (q && lineItems.length > 0) {
        setForm({
          customerId: q.customerId,
          pipelineLeadId: q.pipelineLeadId,
          vehicleId: q.vehicleId,
          vehicleSnapshot: q.vehicleSnapshot,
          vehicleClassMultiplierId: q.vehicleClassMultiplierId,
          selectedServices: lineItems
            .filter((li) => li.type === "service" && li.quoteTemplateId && li.tier)
            .map((li) => ({ templateId: li.quoteTemplateId!, tier: li.tier! })),
          selectedAddons: lineItems
            .filter((li) => li.type === "addon" && li.quoteAddonId)
            .map((li) => li.quoteAddonId!),
          notes: q.notes ?? "",
          validUntil: q.validUntil,
          discountAmount: q.discountAmount,
        });
      }
    }
  }, [mode, existingQuoteId, getQuoteById, getLineItemsByQuoteId]);

  const templates = useMemo(() => getTemplates(), [getTemplates]);
  const multipliers = useMemo(() => getMultipliers(), [getMultipliers]);
  const addons = useMemo(() => getAddons(), [getAddons]);

  const multiplier = useMemo(() => {
    const m = multipliers.find((x) => x.id === form.vehicleClassMultiplierId);
    return m?.multiplier ?? 1;
  }, [multipliers, form.vehicleClassMultiplierId]);

  const vehiclesForCustomer = useMemo(
    () => (form.customerId ? vehicles.filter((v) => v.customerId === form.customerId) : []),
    [form.customerId, vehicles]
  );

  const customerMatches = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const s = customerSearch.trim().toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.phone.replace(/\D/g, "").includes(s.replace(/\D/g, "")) ||
        (c.email && c.email.toLowerCase().includes(s))
    );
  }, [customerSearch, customers]);

  const subtotal = useMemo(() => {
    let total = 0;
    form.selectedServices.forEach(({ templateId, tier }) => {
      const t = templates.find((x) => x.id === templateId);
      if (t) total += t.basePrice * multiplier;
    });
    form.selectedAddons.forEach((addonId) => {
      const a = addons.find((x) => x.id === addonId);
      if (a) total += a.basePrice * (a.isVehicleAdjusted ? multiplier : 1);
    });
    return Math.round(total * 100) / 100;
  }, [form.selectedServices, form.selectedAddons, templates, addons, multiplier]);

  const discountRequiresApproval = subtotal > 0 && form.discountAmount > 0 && form.discountAmount / subtotal > 0.15;
  const canSend = !discountRequiresApproval || (role === "ceo" && hasPermission("quotes.approve_discount"));
  const total = Math.max(0, Math.round((subtotal - form.discountAmount) * 100) / 100);

  const handleSaveDraft = async () => {
    setError(null);
    if (!user?.id) return;
    if (!form.vehicleClassMultiplierId) {
      setError("Select a vehicle class.");
      return;
    }
    if (form.selectedServices.length === 0) {
      setError("Select at least one service.");
      return;
    }
    setIsSubmitting(true);
    try {
      const lineItems = [
        ...form.selectedServices.map((s) => ({ type: "service" as const, quoteTemplateId: s.templateId, tier: s.tier })),
        ...form.selectedAddons.map((id) => ({ type: "addon" as const, quoteAddonId: id })),
      ];
      if (mode === "edit" && existingQuoteId) {
        const updated = updateQuote(existingQuoteId, {
          notes: form.notes || null,
          validUntil: form.validUntil,
          vehicleClassMultiplierId: form.vehicleClassMultiplierId,
          discountAmount: form.discountAmount,
          lineItems,
        });
        if (updated) {
          setSavedQuoteId(updated.id);
          setStep(5);
          if (saveAndSend) {
            sendQuote(updated.id);
            router.push(`/quotes/${updated.id}`);
          }
        }
      } else {
        const quote = createQuote({
          customerId: form.customerId,
          pipelineLeadId: form.pipelineLeadId,
          vehicleId: form.vehicleId,
          vehicleSnapshot: form.vehicleSnapshot,
          vehicleClassMultiplierId: form.vehicleClassMultiplierId,
          createdByUserId: user.id,
          notes: form.notes || null,
          validUntil: form.validUntil,
          lineItems,
          discountAmount: form.discountAmount,
        });
        setSavedQuoteId(quote.id);
        setStep(5);
        if (saveAndSend) {
          sendQuote(quote.id);
          router.push(`/quotes/${quote.id}`);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndSend = () => {
    setSaveAndSend(true);
    handleSaveDraft();
  };

  const selectedCustomer = form.customerId ? customers.find((c) => c.id === form.customerId) : null;
  const selectedVehicle = form.vehicleId ? vehicles.find((v) => v.id === form.vehicleId) : null;

  if (step === 5 && savedQuoteId) {
    const quote = getQuoteById(savedQuoteId);
    return (
      <Card className="border-wraptors-border bg-wraptors-surface">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-wraptors-gold/20 text-wraptors-gold mb-6">
            <Check className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold text-white">Quote saved</h2>
          <p className="text-wraptors-muted mt-2">Quote number</p>
          <p className="text-2xl font-mono font-bold text-wraptors-gold mt-1">{quote?.quoteNumber ?? savedQuoteId}</p>
          <p className="text-sm text-wraptors-muted mt-4 max-w-md mx-auto">
            {saveAndSend ? "Quote has been sent." : "You can edit or send it from the quote detail page."}
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Button asChild variant="outline">
              <Link href={`/quotes/${savedQuoteId}`}>View Quote</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/quotes/new">Create Another</Link>
            </Button>
            <Button asChild>
              <Link href="/quotes">Back to Quotes</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const steps = [
    { num: 1, label: "Customer & Vehicle" },
    { num: 2, label: "Services" },
    { num: 3, label: "Add-ons" },
    { num: 4, label: "Review & Notes" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setStep(s.num as BuilderStep)}
              className={`
                flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors
                ${step === s.num ? "bg-wraptors-gold/20 text-wraptors-gold" : "bg-wraptors-surface-hover text-wraptors-muted hover:text-white"}
              `}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-wraptors-charcoal text-xs">
                {s.num}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-wraptors-muted shrink-0" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Customer & Vehicle */}
      {step === 1 && (
        <Card className="border-wraptors-border bg-wraptors-surface">
          <CardHeader>
            <CardTitle className="text-lg">Customer & Vehicle</CardTitle>
            <CardDescription>Select or create a customer and vehicle, then choose vehicle class.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Search customer</Label>
              <Input
                placeholder="Name, phone, or email"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="mt-1 border-wraptors-border bg-wraptors-charcoal"
              />
              {customerMatches.length > 0 && (
                <div className="mt-2 space-y-1">
                  {customerMatches.slice(0, 5).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setForm((f) => ({
                          ...f,
                          customerId: c.id,
                          pipelineLeadId: null,
                          vehicleId: null,
                          vehicleSnapshot: null,
                        }));
                        setCustomerSearch(c.name);
                      }}
                      className="block w-full text-left rounded-lg border border-wraptors-border bg-wraptors-charcoal px-4 py-2 text-sm hover:bg-wraptors-surface-hover"
                    >
                      {c.name} — {c.phone}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div className="rounded-lg border border-wraptors-border bg-wraptors-charcoal/50 p-4">
                <p className="font-medium text-white">{selectedCustomer.name}</p>
                <p className="text-sm text-wraptors-muted">{selectedCustomer.phone}</p>
                {selectedCustomer.email && (
                  <p className="text-sm text-wraptors-muted">{selectedCustomer.email}</p>
                )}
                <div className="mt-4">
                  <Label className="text-wraptors-muted">Vehicle</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {vehiclesForCustomer.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            vehicleId: v.id,
                            vehicleSnapshot: {
                              year: v.year,
                              make: v.make,
                              model: v.model,
                              color: v.color,
                              trim: v.trim,
                            },
                          }))
                        }
                        className={`rounded-lg border px-4 py-2 text-sm ${
                          form.vehicleId === v.id
                            ? "border-wraptors-gold bg-wraptors-gold/10 text-wraptors-gold"
                            : "border-wraptors-border bg-wraptors-surface hover:border-wraptors-muted"
                        }`}
                      >
                        {v.year} {v.make} {v.model} {v.color ? `(${v.color})` : ""}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date().toISOString();
                        const vid = `veh_quote_${Date.now()}`;
                        const newV: Vehicle = {
                          id: vid,
                          shopId: SHOP_ID,
                          customerId: selectedCustomer.id,
                          make: "TBD",
                          model: "TBD",
                          year: new Date().getFullYear(),
                          serviceJobIds: [],
                          createdAt: now,
                          updatedAt: now,
                        };
                        addVehicle(newV);
                        addVehicleToCustomer(selectedCustomer.id, vid);
                        setForm((f) => ({
                          ...f,
                          vehicleId: vid,
                          vehicleSnapshot: { year: newV.year, make: newV.make, model: newV.model },
                        }));
                      }}
                      className="rounded-lg border border-dashed border-wraptors-border px-4 py-2 text-sm text-wraptors-muted hover:text-wraptors-gold"
                    >
                      + Add vehicle
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!form.customerId && leads.length > 0 && (
              <div>
                <Label className="text-wraptors-muted">Or link to pipeline lead</Label>
                <Select
                  value={form.pipelineLeadId || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      pipelineLeadId: v === "none" ? null : v,
                      customerId: v === "none" ? f.customerId : null,
                      vehicleId: v === "none" ? f.vehicleId : null,
                      vehicleSnapshot: v === "none" ? f.vehicleSnapshot : null,
                    }))
                  }
                >
                  <SelectTrigger className="mt-1 border-wraptors-border bg-wraptors-charcoal">
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name} — {l.contact}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Vehicle class (for pricing)</Label>
              <Select
                value={form.vehicleClassMultiplierId}
                onValueChange={(v) => setForm((f) => ({ ...f, vehicleClassMultiplierId: v }))}
              >
                <SelectTrigger className="mt-1 border-wraptors-border bg-wraptors-charcoal">
                  <SelectValue placeholder="Select vehicle class" />
                </SelectTrigger>
                <SelectContent>
                  {multipliers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label} — {m.multiplier}×
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setStep(2)} disabled={!form.vehicleClassMultiplierId}>
              Next: Services
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Service Selection */}
      {step === 2 && (
        <Card className="border-wraptors-border bg-wraptors-surface">
          <CardHeader>
            <CardTitle className="text-lg">Service selection</CardTitle>
            <CardDescription>
              Prices shown are adjusted for your selected vehicle class ({multiplier}×).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(["ppf", "wrap", "coating"] as const).map((category) => {
              const byTier = templates.filter((t) => t.category === category);
              if (byTier.length === 0) return null;
              const good = byTier.find((t) => t.tier === "good");
              const better = byTier.find((t) => t.tier === "better");
              const best = byTier.find((t) => t.tier === "best");
              return (
                <div key={category} className="rounded-lg border border-wraptors-border overflow-hidden">
                  <div className="bg-wraptors-charcoal/50 px-4 py-2 font-medium text-wraptors-muted-light">
                    {CATEGORY_LABELS[category] ?? category}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-x divide-wraptors-border">
                    {[good, better, best].filter(Boolean).map((t) => {
                      if (!t) return null;
                      const adjusted = Math.round(t.basePrice * multiplier * 100) / 100;
                      const isSelected = form.selectedServices.some(
                        (s) => s.templateId === t.id && s.tier === t.tier
                      );
                      return (
                        <div key={t.id} className="p-4 flex flex-col">
                          <div className="font-medium text-white capitalize">{t.tier}</div>
                          <div className="text-sm text-wraptors-muted mt-1">{t.materialBrand ?? "—"}</div>
                          <div className="text-sm text-wraptors-muted">
                            {t.warrantyYears ? `${t.warrantyYears}yr warranty` : "Lifetime"}
                          </div>
                          <div className="mt-2 text-wraptors-gold font-semibold">
                            {formatCurrency(adjusted)}
                            <span className="text-wraptors-muted text-xs font-normal ml-1">
                              (base {formatCurrency(t.basePrice)})
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            className="mt-4"
                            onClick={() => {
                              setForm((f) => {
                                const next = f.selectedServices.filter((s) => s.templateId !== t.id);
                                if (isSelected) return { ...f, selectedServices: next };
                                return { ...f, selectedServices: [...next, { templateId: t.id, tier: t.tier }] };
                              });
                            }}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={form.selectedServices.length === 0}>
                Next: Add-ons
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Add-ons */}
      {step === 3 && (
        <Card className="border-wraptors-border bg-wraptors-surface">
          <CardHeader>
            <CardTitle className="text-lg">Add-ons</CardTitle>
            <CardDescription>
              Optional add-ons. Price is vehicle-adjusted where applicable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {addons.map((a) => {
              const price = Math.round(a.basePrice * (a.isVehicleAdjusted ? multiplier : 1) * 100) / 100;
              const isOn = form.selectedAddons.includes(a.id);
              return (
                <div
                  key={a.id}
                  className={`flex items-center justify-between rounded-lg border p-4 ${
                    isOn ? "border-wraptors-gold bg-wraptors-gold/5" : "border-wraptors-border"
                  }`}
                >
                  <div>
                    <p className="font-medium text-white">{a.name}</p>
                    <p className="text-sm text-wraptors-muted">{a.description}</p>
                    <p className="text-wraptors-gold font-medium mt-1">{formatCurrency(price)}</p>
                  </div>
                  <Button
                    variant={isOn ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        selectedAddons: isOn
                          ? f.selectedAddons.filter((id) => id !== a.id)
                          : [...f.selectedAddons, a.id],
                      }))
                    }
                  >
                    {isOn ? "Added" : "Add"}
                  </Button>
                </div>
              );
            })}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Next: Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Notes */}
      {step === 4 && (
        <Card className="border-wraptors-border bg-wraptors-surface">
          <CardHeader>
            <CardTitle className="text-lg">Review & Notes</CardTitle>
            <CardDescription>Confirm details, add discount if needed, and set validity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-wraptors-border p-4 space-y-2">
              <p className="text-sm text-wraptors-muted">Customer</p>
              <p className="font-medium text-white">
                {selectedCustomer?.name ?? leadName ?? "—"}
              </p>
              <p className="text-sm text-wraptors-muted">Vehicle</p>
              <p className="font-medium text-white">
                {form.vehicleSnapshot
                  ? `${form.vehicleSnapshot.year} ${form.vehicleSnapshot.make} ${form.vehicleSnapshot.model}`
                  : "—"}
              </p>
            </div>

            <div className="rounded-lg border border-wraptors-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-wraptors-border bg-wraptors-charcoal/50">
                    <th className="text-left font-medium text-wraptors-muted px-4 py-2">Item</th>
                    <th className="text-right font-medium text-wraptors-muted px-4 py-2">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {form.selectedServices.map(({ templateId, tier }) => {
                    const t = templates.find((x) => x.id === templateId);
                    if (!t) return null;
                    const price = Math.round(t.basePrice * multiplier * 100) / 100;
                    return (
                      <tr key={templateId + tier} className="border-b border-wraptors-border/50">
                        <td className="px-4 py-2 text-white">{t.name} ({tier})</td>
                        <td className="px-4 py-2 text-right text-wraptors-gold">{formatCurrency(price)}</td>
                      </tr>
                    );
                  })}
                  {form.selectedAddons.map((id) => {
                    const a = addons.find((x) => x.id === id);
                    if (!a) return null;
                    const price = Math.round(a.basePrice * (a.isVehicleAdjusted ? multiplier : 1) * 100) / 100;
                    return (
                      <tr key={id} className="border-b border-wraptors-border/50">
                        <td className="px-4 py-2 text-white">{a.name}</td>
                        <td className="px-4 py-2 text-right text-wraptors-gold">{formatCurrency(price)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Discount amount ($)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.discountAmount || ""}
                onChange={(e) => setForm((f) => ({ ...f, discountAmount: parseFloat(e.target.value) || 0 }))}
                className="border-wraptors-border bg-wraptors-charcoal"
              />
              {discountRequiresApproval && (
                <div className="flex items-center gap-2 text-amber-400 text-sm">
                  {!canSend && <Lock className="h-4 w-4" />}
                  <span>
                    This discount requires CEO approval before the quote can be sent.
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label>Valid until</Label>
              <Input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                className="mt-1 border-wraptors-border bg-wraptors-charcoal"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Internal notes..."
                className="mt-1 border-wraptors-border bg-wraptors-charcoal"
                rows={3}
              />
            </div>

            <div className="rounded-lg bg-wraptors-charcoal/50 p-4 flex justify-between items-center">
              <span className="text-wraptors-muted">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {form.discountAmount > 0 && (
              <div className="rounded-lg bg-wraptors-charcoal/50 p-4 flex justify-between items-center">
                <span className="text-wraptors-muted">Discount</span>
                <span>-{formatCurrency(form.discountAmount)}</span>
              </div>
            )}
            <div className="rounded-lg bg-wraptors-gold/10 border border-wraptors-gold/30 p-4 flex justify-between items-center">
              <span className="font-semibold text-white">Total</span>
              <span className="font-bold text-wraptors-gold">{formatCurrency(total)}</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                onClick={handleSaveDraft}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving…" : "Save as Draft"}
              </Button>
              <Button
                variant="secondary"
                onClick={handleSaveAndSend}
                disabled={isSubmitting || (!canSend && discountRequiresApproval)}
              >
                {isSubmitting ? "Saving…" : "Save & Send"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sticky footer with running total */}
      {step >= 2 && step <= 4 && (
        <div className="sticky bottom-0 left-0 right-0 z-10 border-t border-wraptors-border bg-wraptors-surface/95 backdrop-blur py-4 px-6 rounded-t-xl">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <span className="text-wraptors-muted">Running total</span>
            <span className="text-xl font-bold text-wraptors-gold">{formatCurrency(step === 4 ? total : subtotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

