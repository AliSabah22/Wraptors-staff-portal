"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type QuoteSummary = {
  quote_id: string;
  status: string;
  customer_name: unknown;
  estimated_value: unknown;
  vehicle_summary: string | null;
  expires_at: string | null;
};

export default function PublicQuoteApprovePage() {
  const params = useParams();
  const token = decodeURIComponent(String(params.token ?? ""));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<QuoteSummary | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ kind: "approved" | "declined"; detail?: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/quote-approval/${encodeURIComponent(token)}`);
      const body = (await res.json()) as { success?: boolean; error?: string; data?: QuoteSummary };
      if (!body?.success || !body.data) {
        setError(body?.error ?? "Could not load quote.");
        setSummary(null);
        return;
      }
      setSummary(body.data);
    } catch {
      setError("Network error.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) void load();
  }, [token, load]);

  const submit = async (action: "approve" | "decline") => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/quote-approval/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          decline_reason: action === "decline" ? declineReason.trim() || null : undefined,
        }),
      });
      const body = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: { status?: string; job_id?: string; message?: string; already?: boolean };
      };
      if (!body?.success) {
        setError(body?.error ?? "Request failed.");
        return;
      }
      if (action === "approve") {
        const d = body.data;
        const jid = d?.job_id;
        setDone({
          kind: "approved",
          detail: jid
            ? `Thank you. Your job reference is ready — the shop will follow up shortly.`
            : d?.message ?? "Thank you — your approval is recorded.",
        });
      } else {
        setDone({ kind: "declined", detail: "You have declined this quote." });
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-wraptors-muted">
        <Loader2 className="h-8 w-8 animate-spin text-wraptors-gold" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4">
        <Card className="border-wraptors-gold/30 bg-wraptors-surface">
          <CardHeader>
            <CardTitle className="text-wraptors-gold">
              {done.kind === "approved" ? "Thank you" : "Recorded"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-wraptors-muted">
            <p>{done.detail}</p>
            <p className="text-xs border-l-2 border-wraptors-gold/50 pl-3">
              This page is secure and read-only after submission. Contact the shop if you need changes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <p className="text-red-400 text-sm">{error}</p>
        <Button variant="link" asChild className="mt-4">
          <Link href="/login">Staff login</Link>
        </Button>
      </div>
    );
  }

  if (!summary) return null;

  const name = String(summary.customer_name ?? "Customer");
  const est =
    summary.estimated_value != null && summary.estimated_value !== ""
      ? formatCurrency(Number(summary.estimated_value))
      : "—";

  return (
    <div className="max-w-lg mx-auto py-12 px-4 space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">Wraptors</h1>
        <p className="text-sm text-wraptors-muted">Quote approval</p>
      </div>

      <Card className="border-wraptors-border bg-wraptors-surface">
        <CardHeader>
          <CardTitle className="text-lg">{name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-wraptors-muted">
          {summary.vehicle_summary && <p>Vehicle: {summary.vehicle_summary}</p>}
          <p>Estimated total: <span className="text-wraptors-gold font-medium">{est}</span></p>
          {summary.expires_at && (
            <p className="text-xs">Link valid until {new Date(summary.expires_at).toLocaleString()}.</p>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          className="flex-1 bg-wraptors-gold text-wraptors-black hover:bg-wraptors-gold/90"
          disabled={busy}
          onClick={() => void submit("approve")}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve quote"}
        </Button>
      </div>

      <Card className="border-wraptors-border/60 border-dashed bg-wraptors-charcoal/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-wraptors-muted">Decline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-wraptors-muted">Optional reason</Label>
            <Textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="mt-1 min-h-[80px]"
              placeholder="Let us know if timing or scope was the issue."
            />
          </div>
          <Button variant="outline" disabled={busy} onClick={() => void submit("decline")}>
            Decline quote
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
