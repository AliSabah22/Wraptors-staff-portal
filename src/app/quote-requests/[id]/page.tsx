"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuotesStore } from "@/stores";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function QuoteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const getQuoteById = useQuotesStore((s) => s.getQuoteById);
  const quote = getQuoteById(id);

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-wraptors-muted">Quote not found.</p>
        <Button variant="link" asChild>
          <Link href="/quote-requests">Back to Quote Requests</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/quote-requests">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{quote.customerName}</h1>
          <p className="text-wraptors-muted mt-0.5">
            {quote.vehicleDescription ?? "—"} · {quote.status}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-wraptors-muted">Phone:</span> {quote.customerPhone}</p>
          {quote.customerEmail && (
            <p><span className="text-wraptors-muted">Email:</span> {quote.customerEmail}</p>
          )}
          <p><span className="text-wraptors-muted">Source:</span> {quote.source}</p>
          <p><span className="text-wraptors-muted">Estimated:</span> {quote.estimatedAmount != null ? formatCurrency(quote.estimatedAmount) : "—"}</p>
          <p><span className="text-wraptors-muted">Created:</span> {formatDate(quote.createdAt)}</p>
          {quote.notes && <p><span className="text-wraptors-muted">Notes:</span> {quote.notes}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
