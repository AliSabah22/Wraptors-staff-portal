"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { mockInvoices } from "@/data/mock";
import { mockCustomers, mockVehicles } from "@/data/mock";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";

const statusVariant: Record<string, "default" | "secondary" | "success"> = {
  draft: "secondary",
  sent: "default",
  paid: "success",
};

export default function InvoicesPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-wraptors-muted mt-0.5">
            Job invoices
          </p>
        </div>
        <Button asChild>Create invoice</Button>
      </div>

      <div className="rounded-xl border border-wraptors-border bg-wraptors-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-wraptors-border bg-wraptors-charcoal/50">
              <th className="text-left font-medium text-wraptors-muted px-6 py-4">Customer</th>
              <th className="text-left font-medium text-wraptors-muted px-6 py-4">Job</th>
              <th className="text-left font-medium text-wraptors-muted px-6 py-4">Amount</th>
              <th className="text-left font-medium text-wraptors-muted px-6 py-4">Tax</th>
              <th className="text-left font-medium text-wraptors-muted px-6 py-4">Total</th>
              <th className="text-left font-medium text-wraptors-muted px-6 py-4">Status</th>
              <th className="text-left font-medium text-wraptors-muted px-6 py-4">Due</th>
            </tr>
          </thead>
          <tbody>
            {mockInvoices.map((inv) => {
              const customer = mockCustomers.find((c) => c.id === inv.customerId);
              return (
                <tr
                  key={inv.id}
                  className="border-b border-wraptors-border/50 hover:bg-wraptors-surface-hover/50"
                >
                  <td className="px-6 py-4 font-medium">{customer?.name ?? "—"}</td>
                  <td className="px-6 py-4 text-wraptors-muted">Job {inv.jobId.slice(-4)}</td>
                  <td className="px-6 py-4">{formatCurrency(inv.amount)}</td>
                  <td className="px-6 py-4 text-wraptors-muted">{formatCurrency(inv.tax)}</td>
                  <td className="px-6 py-4 text-wraptors-gold font-medium">
                    {formatCurrency(inv.total)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusVariant[inv.status] ?? "secondary"}>
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-wraptors-muted">{formatDate(inv.dueDate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
