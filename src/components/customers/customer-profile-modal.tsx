"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockVehicles } from "@/data/mock";
import { useJobsStore } from "@/stores";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Customer } from "@/types";
import { Car, FileText, Phone, Mail, User } from "lucide-react";

type CustomerProfileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
};

export function CustomerProfileModal({
  open,
  onOpenChange,
  customer,
}: CustomerProfileModalProps) {
  if (!customer) return null;

  const vehicles = mockVehicles.filter((v) => v.customerId === customer.id);
  const jobs = useJobsStore((s) => s.jobs).filter((j) => j.customerId === customer.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-wraptors-border bg-wraptors-surface">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-wraptors-gold" />
            {customer.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-wraptors-gold" /> {customer.phone}
              </p>
              {customer.email && (
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-wraptors-gold" /> {customer.email}
                </p>
              )}
              <p className="text-wraptors-muted mt-1">
                {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} · {formatCurrency(customer.totalSpend)} total spend
              </p>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-wraptors-gold" /> Service history
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-sm text-wraptors-muted">No jobs yet.</p>
              ) : (
                <div className="rounded-lg border border-wraptors-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-wraptors-border bg-wraptors-charcoal/50">
                        <th className="text-left font-medium text-wraptors-muted px-4 py-2">Vehicle</th>
                        <th className="text-left font-medium text-wraptors-muted px-4 py-2">Status</th>
                        <th className="text-left font-medium text-wraptors-muted px-4 py-2">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => {
                        const v = vehicles.find((ve) => ve.id === job.vehicleId);
                        return (
                          <tr key={job.id} className="border-b border-wraptors-border/50">
                            <td className="px-4 py-2">
                              {v?.year} {v?.make} {v?.model}
                            </td>
                            <td className="px-4 py-2">
                              <Badge variant={job.progress === 100 ? "success" : "secondary"}>
                                {job.progress}%
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-wraptors-muted">
                              {formatDate(job.dueDate)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button variant="outline" asChild>
              <Link href={`/customers/${customer.id}`} onClick={() => onOpenChange(false)}>
                Open full profile
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
