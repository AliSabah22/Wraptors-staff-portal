"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuotesStore } from "@/stores";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus } from "lucide-react";
import { CreateQuoteModal } from "@/components/quotes/create-quote-modal";

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  new: "default",
  contacted: "secondary",
  quoted: "warning",
  negotiating: "secondary",
  booked: "success",
  lost: "destructive",
};

export default function QuoteRequestsPage() {
  const [mounted, setMounted] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const quotes = useQuotesStore((s) => s.quotes);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quote Requests</h1>
          <p className="text-wraptors-muted mt-0.5">
            From mobile app and other channels
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Create quote request
        </Button>
      </div>

      {quotes.length === 0 ? (
        <Card className="border-wraptors-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-wraptors-gold/10 text-wraptors-gold mb-4">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-white">No quote requests yet</h3>
            <p className="text-sm text-wraptors-muted mt-1 max-w-sm">
              Create a quote request for walk-ins, phone, or web leads.
            </p>
            <Button className="mt-6 gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Create quote request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-wraptors-border bg-wraptors-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-wraptors-border bg-wraptors-charcoal/50">
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Customer</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Vehicle</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Status</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Amount</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Source</th>
                <th className="text-left font-medium text-wraptors-muted px-6 py-4">Created</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-wraptors-border/50 hover:bg-wraptors-surface-hover/50"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium">{q.customerName}</p>
                    <p className="text-xs text-wraptors-muted">{q.customerPhone}</p>
                  </td>
                  <td className="px-6 py-4 text-wraptors-muted-light">
                    {q.vehicleDescription ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusVariant[q.status] ?? "secondary"}>
                      {q.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-wraptors-gold">
                    {q.estimatedAmount != null ? formatCurrency(q.estimatedAmount) : "—"}
                  </td>
                  <td className="px-6 py-4 text-wraptors-muted">{q.source}</td>
                  <td className="px-6 py-4 text-wraptors-muted">{formatDate(q.createdAt)}</td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/quote-requests/${q.id}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateQuoteModal open={createOpen} onOpenChange={setCreateOpen} />
    </motion.div>
  );
}
