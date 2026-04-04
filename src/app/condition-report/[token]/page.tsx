"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function ConditionReportPublicPage() {
  const params = useParams();
  const token = decodeURIComponent(String(params.token ?? ""));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/condition-report/${encodeURIComponent(token)}`);
      const body = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: { acknowledged?: boolean };
      };
      if (!body?.success) {
        setError(body?.error ?? "Could not load report.");
        return;
      }
      setAcknowledged(!!body.data?.acknowledged);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) void load();
  }, [token, load]);

  const onAck = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/condition-report/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledge: true }),
      });
      const body = (await res.json()) as { success?: boolean; error?: string };
      if (!body?.success) {
        setError(body?.error ?? "Could not record acknowledgment.");
        return;
      }
      setAcknowledged(true);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-wraptors-gold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center text-sm text-red-400">{error}</div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-12 px-4 space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-white">Vehicle condition report</h1>
        <p className="text-sm text-wraptors-muted mt-1">Wraptors</p>
      </div>
      <Card className="border-wraptors-border bg-wraptors-surface">
        <CardHeader>
          <CardTitle className="text-base">Acknowledgment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-wraptors-muted">
          {acknowledged ? (
            <p>Thank you — your acknowledgment is on file.</p>
          ) : (
            <>
              <p>
                Please confirm you have reviewed the vehicle condition record for this visit.
              </p>
              <Button
                className="bg-wraptors-gold text-wraptors-black hover:bg-wraptors-gold/90"
                disabled={busy}
                onClick={() => void onAck()}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "I acknowledge"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
