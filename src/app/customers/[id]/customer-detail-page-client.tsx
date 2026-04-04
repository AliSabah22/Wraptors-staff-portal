"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCustomersStore, useJobsStore, useVehiclesStore } from "@/stores";
import type { Customer, ServiceJob, Vehicle } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Car, FileText, Phone, Mail, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapDbVehicleRowToVehicle } from "@/lib/server-data/hydration-mappers";
import { DeleteCustomerOptionsDialog } from "@/components/customers/delete-customer-options-dialog";
import { usePermissions } from "@/hooks/usePermissions";
import { useMergeJobsIntoStore } from "@/hooks/useSeedJobsStore";

export function CustomerDetailPageClient({
  customerId,
  initialCustomer,
  initialVehicles,
  initialJobs,
}: {
  customerId: string;
  initialCustomer: Customer;
  initialVehicles: Vehicle[];
  initialJobs: ServiceJob[];
}) {
  const router = useRouter();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vMake, setVMake] = useState("");
  const [vModel, setVModel] = useState("");
  const [vYear, setVYear] = useState(String(new Date().getFullYear()));
  const [vColor, setVColor] = useState("");
  const [vVin, setVVin] = useState("");
  const [vPlate, setVPlate] = useState("");
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [decodeLoading, setDecodeLoading] = useState(false);
  const getCustomerById = useCustomersStore((s) => s.getCustomerById);
  const addVehicleToCustomer = useCustomersStore((s) => s.addVehicleToCustomer);
  const addVehicle = useVehiclesStore((s) => s.addVehicle);

  useEffect(() => {
    const prev = useCustomersStore
      .getState()
      .customers.filter((c) => c.id !== initialCustomer.id);
    useCustomersStore.setState({ customers: [initialCustomer, ...prev] });
  }, [initialCustomer]);

  useEffect(() => {
    if (!initialVehicles.length) return;
    const ids = new Set(initialVehicles.map((v) => v.id));
    const rest = useVehiclesStore.getState().vehicles.filter((v) => !ids.has(v.id));
    useVehiclesStore.setState({ vehicles: [...initialVehicles, ...rest] });
  }, [initialVehicles]);

  useMergeJobsIntoStore(initialJobs);

  const customer = getCustomerById(customerId);
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const jobs = useJobsStore((s) => s.jobs);
  const { hasPermission } = usePermissions();
  const canDeleteCustomer = hasPermission("customers.delete");
  const canAddVehicle = hasPermission("vehicles.create");

  const handleDecodeVin = async () => {
    setVehicleError(null);
    setDecodeLoading(true);
    try {
      const q = new URLSearchParams({ vin: vVin.trim() });
      const res = await fetch(`/api/vehicles/decode-vin?${q}`);
      const body = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: { make: string; model: string; year: number };
      };
      if (!body?.success || !body.data) {
        setVehicleError(body?.error ?? "Decode failed");
        return;
      }
      setVMake(body.data.make);
      setVModel(body.data.model);
      setVYear(String(body.data.year));
    } catch {
      setVehicleError("Network error while decoding VIN.");
    } finally {
      setDecodeLoading(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddVehicle) return;
    setVehicleError(null);
    const year = parseInt(vYear, 10);
    if (!vMake.trim() || !vModel.trim() || Number.isNaN(year)) {
      setVehicleError("Make, model, and a valid year are required.");
      return;
    }
    setVehicleSaving(true);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          make: vMake.trim(),
          model: vModel.trim(),
          year,
          color: vColor.trim() || null,
          vin: vVin.trim() || null,
          license_plate: vPlate.trim() || null,
          notes: null,
        }),
      });
      const body = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: Record<string, unknown>;
      };
      if (!body?.success || !body.data) {
        setVehicleError(body?.error ?? "Could not save vehicle.");
        return;
      }
      const vehicle = mapDbVehicleRowToVehicle(body.data);
      addVehicle(vehicle);
      addVehicleToCustomer(customerId, vehicle.id);
      setShowAddVehicle(false);
      setVMake("");
      setVModel("");
      setVYear(String(new Date().getFullYear()));
      setVColor("");
      setVVin("");
      setVPlate("");
    } catch {
      setVehicleError("Network error while saving vehicle.");
    } finally {
      setVehicleSaving(false);
    }
  };

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-wraptors-muted">Customer not found.</p>
        <Button variant="link" asChild>
          <Link href="/customers">Back to Customers</Link>
        </Button>
      </div>
    );
  }

  const customerVehicles = vehicles.filter((v) => v.customerId === customer.id);
  const customerJobs = jobs.filter((j) => j.customerId === customer.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-wraptors-muted mt-0.5">
            {customerVehicles.length} vehicles · {formatCurrency(customer.totalSpend)} total spend
          </p>
        </div>
        {canDeleteCustomer && (
          <Button
            variant="outline"
            size="sm"
            className="text-red-400 border-red-400/50 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        )}
      </div>

      <DeleteCustomerOptionsDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        customerId={customerId}
        customerName={customer.name}
        onDeletedEntirely={() => router.push("/customers")}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-wraptors-gold" /> {customer.phone}
            </p>
            {customer.email && (
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-wraptors-gold" /> {customer.email}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-4 w-4 text-wraptors-gold" /> Vehicles
            </CardTitle>
            {canAddVehicle && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddVehicle((s) => !s);
                  setVehicleError(null);
                }}
              >
                {showAddVehicle ? "Cancel" : "Add vehicle"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-xs text-wraptors-muted mb-4 border-l-2 border-wraptors-gold/40 pl-3">
              Warranties are tracked on completed jobs — open a job to add or view coverage.
            </p>
            {showAddVehicle && canAddVehicle && (
              <form
                onSubmit={handleAddVehicle}
                className="mb-6 space-y-3 rounded-lg border border-wraptors-border/80 bg-wraptors-charcoal/20 p-4"
              >
                <p className="text-xs text-wraptors-muted">
                  Enter a 17-character VIN and use <span className="text-wraptors-gold/90">Decode VIN</span>{" "}
                  to fill make, model, and year (NHTSA).
                </p>
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-wraptors-muted text-xs">VIN</Label>
                    <Input
                      value={vVin}
                      onChange={(e) => setVVin(e.target.value)}
                      className="mt-1 font-mono text-sm"
                      placeholder="17-character VIN"
                      maxLength={17}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={decodeLoading || !hasPermission("vehicles.view")}
                    onClick={() => void handleDecodeVin()}
                  >
                    {decodeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Decode VIN"}
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-wraptors-muted text-xs">Make</Label>
                    <Input value={vMake} onChange={(e) => setVMake(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-wraptors-muted text-xs">Model</Label>
                    <Input value={vModel} onChange={(e) => setVModel(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-wraptors-muted text-xs">Year</Label>
                    <Input
                      type="number"
                      value={vYear}
                      onChange={(e) => setVYear(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-wraptors-muted text-xs">Color</Label>
                    <Input value={vColor} onChange={(e) => setVColor(e.target.value)} className="mt-1" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-wraptors-muted text-xs">License plate</Label>
                    <Input value={vPlate} onChange={(e) => setVPlate(e.target.value)} className="mt-1" />
                  </div>
                </div>
                {vehicleError && (
                  <p className="text-xs text-red-400" role="alert">
                    {vehicleError}
                  </p>
                )}
                <Button type="submit" disabled={vehicleSaving} className="bg-wraptors-gold text-wraptors-black">
                  {vehicleSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving…
                    </>
                  ) : (
                    "Save vehicle"
                  )}
                </Button>
              </form>
            )}
            <ul className="space-y-3">
              {customerVehicles.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-lg border border-wraptors-border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {v.year} {v.make} {v.model}
                    </p>
                    <p className="text-sm text-wraptors-muted">
                      {v.color ?? "—"} · {v.plate ?? "No plate"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/jobs?vehicle=${v.id}`}>View jobs</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-wraptors-gold" /> Service history
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-wraptors-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-wraptors-border bg-wraptors-charcoal/50">
                  <th className="text-left font-medium text-wraptors-muted px-6 py-3">Vehicle</th>
                  <th className="text-left font-medium text-wraptors-muted px-6 py-3">Service</th>
                  <th className="text-left font-medium text-wraptors-muted px-6 py-3">Status</th>
                  <th className="text-left font-medium text-wraptors-muted px-6 py-3">Due</th>
                </tr>
              </thead>
              <tbody>
                {customerJobs.map((job) => {
                  const v = customerVehicles.find((ve) => ve.id === job.vehicleId);
                  return (
                    <tr key={job.id} className="border-b border-wraptors-border/50">
                      <td className="px-6 py-3">
                        {v?.year} {v?.make} {v?.model}
                      </td>
                      <td className="px-6 py-3 text-wraptors-gold">Job #{job.id}</td>
                      <td className="px-6 py-3">
                        <Badge variant={job.progress === 100 ? "success" : "secondary"}>
                          {job.progress}%
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-wraptors-muted">
                        {formatDate(job.dueDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
