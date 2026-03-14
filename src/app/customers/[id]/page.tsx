"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCustomersStore, useJobsStore, useVehiclesStore } from "@/stores";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Car, FileText, Phone, Mail, Trash2 } from "lucide-react";
import { DeleteCustomerOptionsDialog } from "@/components/customers/delete-customer-options-dialog";
import { usePermissions } from "@/hooks/usePermissions";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const getCustomerById = useCustomersStore((s) => s.getCustomerById);
  const customer = getCustomerById(id);
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const jobs = useJobsStore((s) => s.jobs);
  const { hasPermission } = usePermissions();
  const canDeleteCustomer = hasPermission("customers.delete");

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
        customerId={id}
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-4 w-4 text-wraptors-gold" /> Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
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
