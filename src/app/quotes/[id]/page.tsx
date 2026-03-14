"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuoteBuilderStore } from "@/stores/quote-builder";
import { useCustomersStore, usePipelineStore, useTeamStore } from "@/stores";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { canApproveDiscount } from "@/lib/quote-builder/access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Send,
  Check,
  X,
  Briefcase,
  Lock,
  FileText,
  Car,
  User,
} from "lucide-react";
import type { SmartQuote } from "@/types";

function statusBadgeVariant(status: SmartQuote["status"]) {
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

export default function QuoteDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { user, role } = useCurrentUser();
  const { hasPermission } = usePermissions();

  const getQuoteById = useQuoteBuilderStore((s) => s.getQuoteById);
  const getLineItemsByQuoteId = useQuoteBuilderStore((s) => s.getLineItemsByQuoteId);
  const sendQuote = useQuoteBuilderStore((s) => s.sendQuote);
  const acceptQuote = useQuoteBuilderStore((s) => s.acceptQuote);
  const declineQuote = useQuoteBuilderStore((s) => s.declineQuote);
  const approveDiscount = useQuoteBuilderStore((s) => s.approveDiscount);
  const convertToJob = useQuoteBuilderStore((s) => s.convertToJob);

  const customers = useCustomersStore((s) => s.customers);
  const getLeadById = usePipelineStore((s) => s.getLeadById);
  const members = useTeamStore((s) => s.members);

  const [acceptTier, setAcceptTier] = useState<"good" | "better" | "best" | "">("");
  const [converting, setConverting] = useState(false);

  const quote = getQuoteById(id);
  const lineItems = quote ? getLineItemsByQuoteId(id) : [];
  const customerName = quote?.customerId
    ? customers.find((c) => c.id === quote.customerId)?.name
    : quote?.pipelineLeadId
      ? getLeadById(quote.pipelineLeadId)?.name
      : "—";
  const createdByName = quote
    ? members.find((m) => m.id === quote.createdByUserId)?.name ?? quote.createdByUserId
    : "—";
  const canApprove = canApproveDiscount(role);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleSend = () => {
    if (!quote || quote.status !== "draft") return;
    if (quote.discountRequiresApproval && !quote.discountApprovedByUserId) return;
    sendQuote(quote.id);
  };

  const handleAccept = () => {
    if (!quote || quote.status !== "sent" || !acceptTier) return;
    acceptQuote(quote.id, acceptTier);
    setAcceptTier("");
  };

  const handleDecline = () => {
    if (!quote || quote.status !== "sent") return;
    declineQuote(quote.id);
  };

  const handleApproveDiscount = () => {
    if (!quote || !quote.discountRequiresApproval) return;
    approveDiscount(quote.id);
  };

  const handleConvertToJob = () => {
    if (!quote || quote.status !== "accepted" || quote.convertedToJobId) return;
    setConverting(true);
    try {
      const result = convertToJob(quote.id);
      if (result) {
        window.location.href = `/jobs/${result.jobId}`;
      }
    } finally {
      setConverting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-wraptors-surface-hover rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-wraptors-surface rounded animate-pulse" />
          <div className="h-64 bg-wraptors-surface rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="space-y-6">
        <p className="text-wraptors-muted">Quote not found.</p>
        <Button asChild variant="outline">
          <Link href="/quotes">Back to Quotes</Link>
        </Button>
      </div>
    );
  }

  const sendDisabled = quote.status !== "draft" || (quote.discountRequiresApproval && !quote.discountApprovedByUserId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/quotes">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-wraptors-gold" />
              {quote.quoteNumber}
            </h1>
            <p className="text-wraptors-muted mt-0.5">
              Created {formatDateTime(quote.createdAt)} by {createdByName}
            </p>
          </div>
        </div>
        <Badge variant={statusBadgeVariant(quote.status)} className="shrink-0">
          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: quote content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-wraptors-border bg-wraptors-surface">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer & Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium text-white">{customerName}</p>
              {quote.vehicleSnapshot && (
                <p className="text-wraptors-muted flex items-center gap-1.5">
                  <Car className="h-4 w-4" />
                  {quote.vehicleSnapshot.year} {quote.vehicleSnapshot.make} {quote.vehicleSnapshot.model}
                  {quote.vehicleSnapshot.color ? ` (${quote.vehicleSnapshot.color})` : ""}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-wraptors-border bg-wraptors-surface">
            <CardHeader>
              <CardTitle className="text-lg">Line items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-wraptors-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-wraptors-border bg-wraptors-charcoal/50">
                      <th className="text-left font-medium text-wraptors-muted px-4 py-3">Item</th>
                      <th className="text-left font-medium text-wraptors-muted px-4 py-3">Tier</th>
                      <th className="text-right font-medium text-wraptors-muted px-4 py-3">Base</th>
                      <th className="text-right font-medium text-wraptors-muted px-4 py-3">Multiplier</th>
                      <th className="text-right font-medium text-wraptors-muted px-4 py-3">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li) => (
                      <tr key={li.id} className="border-b border-wraptors-border/50">
                        <td className="px-4 py-3 text-white">{li.label}</td>
                        <td className="px-4 py-3 text-wraptors-muted">
                          {li.tier ? li.tier.charAt(0).toUpperCase() + li.tier.slice(1) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-wraptors-muted">
                          {formatCurrency(li.basePrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-wraptors-muted">
                          {li.multiplierApplied}×
                        </td>
                        <td className="px-4 py-3 text-right text-wraptors-gold font-medium">
                          {formatCurrency(li.finalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-wraptors-muted">
                  <span>Subtotal</span>
                  <span>{formatCurrency(quote.subtotal)}</span>
                </div>
                {quote.discountAmount > 0 && (
                  <div className="flex justify-between text-wraptors-muted">
                    <span>Discount</span>
                    <span>-{formatCurrency(quote.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-wraptors-gold pt-2 border-t border-wraptors-border">
                  <span>Total</span>
                  <span>{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {quote.notes && (
            <Card className="border-wraptors-border bg-wraptors-surface">
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-wraptors-muted-light whitespace-pre-wrap">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: actions & activity */}
        <div className="space-y-6">
          <Card className="border-wraptors-border bg-wraptors-surface">
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
              <CardDescription>Valid until {formatDate(quote.validUntil)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quote.status === "draft" && (
                <>
                  <Button asChild variant="outline" className="w-full justify-start gap-2">
                    <Link href={`/quotes/${id}/edit`}>
                      <Briefcase className="h-4 w-4" /> Edit
                    </Link>
                  </Button>
                  <Button
                    className="w-full justify-start gap-2"
                    disabled={sendDisabled}
                    onClick={handleSend}
                  >
                    <Send className="h-4 w-4" /> Send Quote
                  </Button>
                  {quote.discountRequiresApproval && !quote.discountApprovedByUserId && (
                    <p className="text-xs text-amber-400 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Send disabled until CEO approves discount
                    </p>
                  )}
                </>
              )}
              {quote.status === "sent" && (
                <>
                  <div className="flex gap-2">
                    <select
                      value={acceptTier}
                      onChange={(e) => setAcceptTier(e.target.value as "good" | "better" | "best")}
                      className="flex h-9 w-full rounded-md border border-wraptors-border bg-wraptors-charcoal px-3 text-sm text-white"
                    >
                      <option value="">Select tier</option>
                      <option value="good">Good</option>
                      <option value="better">Better</option>
                      <option value="best">Best</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={handleAccept}
                      disabled={!acceptTier}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" /> Accept
                    </Button>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDecline} className="gap-1">
                    <X className="h-4 w-4" /> Decline
                  </Button>
                </>
              )}
              {quote.status === "accepted" && (
                <>
                  {quote.convertedToJobId ? (
                    <Button asChild className="w-full justify-start gap-2">
                      <Link href={`/jobs/${quote.convertedToJobId}`}>
                        <Briefcase className="h-4 w-4" /> View Job
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      className="w-full justify-start gap-2"
                      id="convert"
                      onClick={handleConvertToJob}
                      disabled={converting}
                    >
                      <Briefcase className="h-4 w-4" />
                      {converting ? "Converting…" : "Convert to Job"}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {quote.discountRequiresApproval && (
            <Card className="border-wraptors-border bg-wraptors-surface border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-400">
                  <Lock className="h-5 w-5" />
                  Discount approval
                </CardTitle>
                <CardDescription>
                  {canApprove
                    ? "This discount exceeds 15% of subtotal. Approve to allow sending."
                    : "Awaiting CEO approval for this discount."}
                </CardDescription>
              </CardHeader>
              {canApprove && (
                <CardContent>
                  <Button onClick={handleApproveDiscount} className="w-full">
                    Approve Discount
                  </Button>
                </CardContent>
              )}
            </Card>
          )}

          <Card className="border-wraptors-border bg-wraptors-surface">
            <CardHeader>
              <CardTitle className="text-lg">Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-wraptors-muted">
              <p>Created {formatDateTime(quote.createdAt)} by {createdByName}</p>
              {quote.sentAt && (
                <p>Sent {formatDateTime(quote.sentAt)}</p>
              )}
              {quote.acceptedAt && (
                <p>Accepted {formatDateTime(quote.acceptedAt)}</p>
              )}
              {quote.convertedToJobId && (
                <p>
                  Converted to job —{" "}
                  <Link href={`/jobs/${quote.convertedToJobId}`} className="text-wraptors-gold hover:underline">
                    View job
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
