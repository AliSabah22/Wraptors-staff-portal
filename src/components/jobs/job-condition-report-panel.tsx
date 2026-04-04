"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2, ClipboardList } from "lucide-react";

type ReportRow = {
  id: string;
  zones: Record<string, unknown>;
  acknowledgment_token: string | null;
  acknowledgment_token_expires_at: string | null;
  acknowledged_at: string | null;
};

export function JobConditionReportPanel({ jobId }: { jobId: string }) {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("jobs.view_operational");
  const canEdit = hasPermission("jobs.edit_basic");
  const [report, setReport] = useState<ReportRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [zonesJson, setZonesJson] = useState("{}");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [publicPath, setPublicPath] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setErr(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/condition-report`);
      const body = (await res.json()) as {
        success?: boolean;
        data?: { report?: ReportRow | null };
        error?: string;
      };
      if (!body?.success) {
        setErr(body?.error ?? "Could not load condition report.");
        return;
      }
      const r = body.data?.report ?? null;
      setReport(r);
      setZonesJson(r?.zones ? JSON.stringify(r.zones, null, 2) : "{}");
    } catch {
      setErr("Network error.");
    } finally {
      setLoading(false);
    }
  }, [jobId, canView]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (report?.acknowledgment_token) {
      setPublicPath(`/condition-report/${encodeURIComponent(report.acknowledgment_token)}`);
    } else {
      setPublicPath(null);
    }
  }, [report?.acknowledgment_token]);

  const save = async (regenerate: boolean) => {
    if (!canEdit) return;
    let zones: Record<string, unknown> = {};
    try {
      zones = JSON.parse(zonesJson) as Record<string, unknown>;
    } catch {
      setErr("Zones must be valid JSON.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/condition-report`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zones, regenerate_public_link: regenerate }),
      });
      const body = (await res.json()) as { success?: boolean; data?: ReportRow; error?: string };
      if (!body?.success || !body.data) {
        setErr(body?.error ?? "Save failed.");
        return;
      }
      setReport(body.data);
      if (body.data.acknowledgment_token) {
        const t = encodeURIComponent(body.data.acknowledgment_token);
        setPublicPath(`/condition-report/${t}`);
      }
    } catch {
      setErr("Network error.");
    } finally {
      setSaving(false);
    }
  };

  if (!canView) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-wraptors-gold" /> Condition report (intake)
        </CardTitle>
        <p className="text-xs text-wraptors-muted">Zones JSON + customer acknowledgment link</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-wraptors-gold" />
        ) : (
          <>
            {canEdit && (
              <div>
                <Label className="text-xs text-wraptors-muted">Zones (JSON)</Label>
                <Textarea
                  value={zonesJson}
                  onChange={(e) => setZonesJson(e.target.value)}
                  className="mt-1 font-mono text-xs min-h-[120px]"
                />
              </div>
            )}
            {!canEdit && report && (
              <pre className="text-xs text-wraptors-muted overflow-x-auto max-h-40">
                {JSON.stringify(report.zones, null, 2)}
              </pre>
            )}
            {report?.acknowledged_at && (
              <p className="text-xs text-emerald-400/90">Customer acknowledged {report.acknowledged_at}</p>
            )}
            {publicPath && (
              <p className="text-xs text-wraptors-gold/90 break-all border-l-2 border-wraptors-gold/40 pl-2">
                Public link: {typeof window !== "undefined" ? `${window.location.origin}${publicPath}` : publicPath}
              </p>
            )}
            {canEdit && (
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void save(false)}>
                  Save
                </Button>
                <Button type="button" size="sm" disabled={saving} onClick={() => void save(true)}>
                  Save &amp; refresh public link
                </Button>
              </div>
            )}
          </>
        )}
        {err && (
          <p className="text-xs text-red-400" role="alert">
            {err}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
