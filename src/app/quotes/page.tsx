"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuoteBuilderStore } from "@/stores/quote-builder";
import { useCustomersStore } from "@/stores";
import { usePipelineStore } from "@/stores";
import { useTeamStore } from "@/stores";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Plus, Search } from "lucide-react";
import type { SmartQuote } from "@/types";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "expired", label: "Expired" },
];

function statusBadgeVariant(status: SmartQuote["status"]): "secondary" | "default" | "success" | "destructive" | "warning" {
  switch (status) {
    case "draft":
      return "secondary";
    case "sent":
      return "default";
    case "accepted":
      return "success";
    case "declined":
      return "destructive";
    case "expired":
      return "warning";
    default:
      return "secondary";
  }
}

function QuoteListContent() {
  const getQuotes = useQuoteBuilderStore((s) => s.getQuotes);
  const getLineItemsByQuoteId = useQuoteBuilderStore((s) => s.getLineItemsByQuoteId);
  const customers = useCustomersStore((s) => s.customers);
  const getLeadById = usePipelineStore((s) => s.getLeadById);
  const members = useTeamStore((s) => s.members);

  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const filters = useMemo(
    () => ({
      ...(statusFilter !== "all" && { status: statusFilter as SmartQuote["status"] }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(search.trim() && { search: search.trim() }),
    }),
    [statusFilter, dateFrom, dateTo, search]
  );

  const { items: quotes, total } = useMemo(
    () => getQuotes(filters, page, pageSize),
    [getQuotes, filters, page, pageSize]
  );

  const customerNameById = useMemo(() => {
    const m = new Map<string, string>();
    customers.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [customers]);

  const createdByNameById = useMemo(() => {
    const m = new Map<string, string>();
    members.forEach((memb) => m.set(memb.id, memb.name));
    return m;
  }, [members]);

  const summarizeServices = (quoteId: string) => {
    const lineItems = getLineItemsByQuoteId(quoteId);
    const services = lineItems.filter((li) => li.type === "service");
    const addons = lineItems.filter((li) => li.type === "addon");
    const parts: string[] = [];
    if (services.length > 0) {
      const names = [...new Set(services.map((s) => s.label))];
      parts.push(names.join(", "));
    }
    if (addons.length > 0) {
      parts.push(`${addons.length} add-on${addons.length !== 1 ? "s" : ""}`);
    }
    return parts.length > 0 ? parts.join(" + ") : "—";
  };

  const getCustomerDisplay = (q: SmartQuote) => {
    if (q.customerId) {
      return customerNameById.get(q.customerId) ?? "—";
    }
    if (q.pipelineLeadId) {
      const lead = getLeadById(q.pipelineLeadId);
      return lead ? `Lead: ${lead.name}` : "Lead";
    }
    return "—";
  };

  const vehicleDisplay = (q: SmartQuote) => {
    const vs = q.vehicleSnapshot;
    if (!vs) return "—";
    return `${vs.year} ${vs.make} ${vs.model}${vs.color ? ` (${vs.color})` : ""}`;
  };

  const isEmpty = quotes.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quotes</h1>
          <p className="text-wraptors-muted mt-0.5">
            Smart Quote Builder — create and manage professional quotes
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/quotes/new">
            <Plus className="h-4 w-4" /> New Quote
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] border-wraptors-border bg-wraptors-surface">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          placeholder="From"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-[140px] border-wraptors-border bg-wraptors-surface"
        />
        <Input
          type="date"
          placeholder="To"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-[140px] border-wraptors-border bg-wraptors-surface"
        />
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wraptors-muted" />
          <Input
            placeholder="Search by quote # or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-wraptors-border bg-wraptors-surface"
          />
        </div>
      </div>

      {isEmpty ? (
        <Card className="border-wraptors-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-wraptors-gold/10 text-wraptors-gold mb-4">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-white">No quotes found</h3>
            <p className="text-sm text-wraptors-muted mt-1 max-w-sm">
              Create your first quote to get started. Build a professional quote in under 2 minutes.
            </p>
            <Button asChild className="mt-6 gap-2">
              <Link href="/quotes/new">
                <Plus className="h-4 w-4" /> Create Quote
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-wraptors-border bg-wraptors-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-wraptors-border bg-wraptors-charcoal/50">
                  <th className="text-left font-medium text-wraptors-muted px-6 py-4">Quote #</th>
                  <th className="text-left font-medium text-wraptors-muted px-6 py-4">Customer</th>
                  <th className="text-left font-medium text-wraptors-muted px-6 py-4">Vehicle</th>
                  <th className="text-left font-medium text-wraptors-muted px-6 py-4">Services</th>
                  <th className="text-left font-medium text-wraptors-muted px-6 py-4">Total</th>
                  <th className="text-left font-medium text-wraptors-muted px-6 py-4">Status</th>
                  <th className="text-left font-medium text-wraptors-muted px-6 py-4">Valid until</th>
                  <th className="text-left font-medium text-wraptors-muted px-6 py-4">Created by</th>
                  <th className="w-24 text-right font-medium text-wraptors-muted px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b border-wraptors-border/50 hover:bg-wraptors-surface-hover/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/quotes/${q.id}`}
                        className="font-medium text-white hover:text-wraptors-gold"
                      >
                        {q.quoteNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-wraptors-muted-light">{getCustomerDisplay(q)}</td>
                    <td className="px-6 py-4 text-wraptors-muted-light">{vehicleDisplay(q)}</td>
                    <td className="px-6 py-4 text-wraptors-muted max-w-[200px] truncate">
                      {summarizeServices(q.id)}
                    </td>
                    <td className="px-6 py-4 text-wraptors-gold font-medium">
                      {formatCurrency(q.total)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusBadgeVariant(q.status)}>
                        {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-wraptors-muted">{formatDate(q.validUntil)}</td>
                    <td className="px-6 py-4 text-wraptors-muted">
                      {createdByNameById.get(q.createdByUserId) ?? q.createdByUserId}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/quotes/${q.id}`}
                          className="text-wraptors-gold hover:underline text-xs"
                        >
                          View
                        </Link>
                        {q.status === "draft" && (
                          <Link
                            href={`/quotes/${q.id}/edit`}
                            className="text-wraptors-gold hover:underline text-xs"
                          >
                            Edit
                          </Link>
                        )}
                        {q.status === "accepted" && !q.convertedToJobId && (
                          <Link
                            href={`/quotes/${q.id}#convert`}
                            className="text-wraptors-gold hover:underline text-xs"
                          >
                            Convert
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > pageSize && (
            <div className="border-t border-wraptors-border px-6 py-3 flex items-center justify-between text-sm text-wraptors-muted">
              <span>
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * pageSize >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function QuotesPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quotes</h1>
            <p className="text-wraptors-muted mt-0.5">Loading…</p>
          </div>
        </div>
        <div className="h-64 rounded-xl border border-wraptors-border bg-wraptors-surface animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <QuoteListContent />
    </motion.div>
  );
}
