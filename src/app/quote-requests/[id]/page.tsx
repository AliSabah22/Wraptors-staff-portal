"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useQuotesStore } from "@/stores";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { ComingSoonCard } from "@/components/ui/coming-soon-card";

type QuoteApiRow = Record<string, unknown> & {
  id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  status?: string;
  estimated_value?: number | null;
  notes?: string | null;
  created_at?: string;
  approval_token_expires_at?: string | null;
};

export default function QuoteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const getQuoteById = useQuotesStore((s) => s.getQuoteById);
  const storeQuote = getQuoteById(id);
  const { hasPermission } = usePermissions();
  const [row, setRow] = useState<QuoteApiRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendBusy, setSendBusy] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quote-requests/${id}`);
      const body = (await res.json()) as { success?: boolean; data?: QuoteApiRow; error?: string };
      if (body?.success && body.data) setRow(body.data);
      else setRow(null);
    } catch {
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const sendApproval = async () => {
    setSendError(null);
    setSendBusy(true);
    try {
      const res = await fetch(`/api/quote-requests/${id}/send-approval`, { method: "POST" });
      const body = (await res.json()) as {
        success?: boolean;
        data?: { approval_url?: string };
        error?: string;
      };
      if (!body?.success) {
        setSendError(body?.error ?? "Could not create approval link.");
        return;
      }
      setApprovalUrl(body.data?.approval_url ?? null);
      void load();
    } catch {
      setSendError("Network error.");
    } finally {
      setSendBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-wraptors-muted">
        <Loader2 className="h-8 w-8 animate-spin text-wraptors-gold" />
      </div>
    );
  }

  if (!row && !storeQuote) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-wraptors-muted">Quote not found.</p>
        <Button variant="link" asChild>
          <Link href="/quote-requests">Back to Quote Requests</Link>
        </Button>
      </div>
    );
  }

  const name =
    (row?.customer_name as string) ?? storeQuote?.customerName ?? "Customer";
  const phone = (row?.customer_phone as string) ?? storeQuote?.customerPhone ?? "—";
  const email = (row?.customer_email as string) ?? storeQuote?.customerEmail;
  const status = (row?.status as string) ?? storeQuote?.status ?? "—";
  const est =
    row?.estimated_value != null
      ? formatCurrency(Number(row.estimated_value))
      : storeQuote?.estimatedAmount != null
        ? formatCurrency(storeQuote.estimatedAmount)
        : "—";
  const created = row?.created_at
    ? formatDate(String(row.created_at).slice(0, 10))
    : storeQuote
      ? formatDate(storeQuote.createdAt)
      : "—";
  const notes = (row?.notes as string) ?? storeQuote?.notes;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/quote-requests">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          <p className="text-wraptors-muted mt-0.5 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{status}</Badge>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-wraptors-muted">Phone:</span> {phone}
          </p>
          {email && (
            <p>
              <span className="text-wraptors-muted">Email:</span> {email}
            </p>
          )}
          <p>
            <span className="text-wraptors-muted">Estimated:</span> {est}
          </p>
          <p>
            <span className="text-wraptors-muted">Created:</span> {created}
          </p>
          {notes && (
            <p>
              <span className="text-wraptors-muted">Notes:</span> {notes}
            </p>
          )}
        </CardContent>
      </Card>

      {hasPermission("quotes.edit") && (
        <Card>
          <CardHeader>
            <CardTitle>Customer approval link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-wraptors-muted">
              Generates a secure link (valid 7 days) for the customer to approve or decline this quote on the web.
            </p>
            <ComingSoonCard
              title="Email this link automatically"
              description="SMTP / Resend integration will send the approval link to the customer."
              blockedBy="Configure transactional email in production — not enabled in this build."
            />
            {row?.approval_token_expires_at && (
              <p className="text-xs text-wraptors-muted">
                Current link expires:{" "}
                {new Date(String(row.approval_token_expires_at)).toLocaleString()}
              </p>
            )}
            {approvalUrl && (
              <div className="space-y-1">
                <label className="text-xs text-wraptors-muted">Approval URL (copy for customer)</label>
                <Input readOnly value={approvalUrl} className="font-mono text-xs" />
              </div>
            )}
            {sendError && (
              <p className="text-sm text-red-400" role="alert">
                {sendError}
              </p>
            )}
            <Button type="button" disabled={sendBusy} onClick={() => void sendApproval()}>
              {sendBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Working…
                </>
              ) : (
                "Generate / refresh approval link"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
