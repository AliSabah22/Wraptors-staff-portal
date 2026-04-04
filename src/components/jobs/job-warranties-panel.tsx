"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDate } from "@/lib/utils";
import { Loader2, Shield } from "lucide-react";

type WarrantyRow = {
  id: string;
  coverage_description: string;
  expires_at: string;
};

export function JobWarrantiesPanel({
  jobId,
  showWhenCompleted,
  jobCompleted,
}: {
  jobId: string;
  showWhenCompleted: boolean;
  jobCompleted: boolean;
}) {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("jobs.view_operational");
  const canEdit = hasPermission("jobs.edit_basic");
  const [rows, setRows] = useState<WarrantyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [desc, setDesc] = useState("");
  const [expires, setExpires] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setErr(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/warranties`);
      const body = (await res.json()) as {
        success?: boolean;
        data?: { warranties?: WarrantyRow[] };
        error?: string;
      };
      if (!body?.success) {
        setErr(body?.error ?? "Could not load warranties.");
        return;
      }
      setRows(body.data?.warranties ?? []);
    } catch {
      setErr("Network error.");
    } finally {
      setLoading(false);
    }
  }, [jobId, canView]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!canView || !showWhenCompleted || !jobCompleted) return null;

  const addWarranty = async () => {
    if (!canEdit || !desc.trim() || !expires) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/warranties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverage_description: desc.trim(),
          expires_at: expires,
        }),
      });
      const body = (await res.json()) as { success?: boolean; error?: string };
      if (!body?.success) {
        setErr(body?.error ?? "Save failed.");
        return;
      }
      setDesc("");
      setExpires("");
      void load();
    } catch {
      setErr("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (wid: string) => {
    if (!canEdit) return;
    setErr(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/warranties/${wid}`, { method: "DELETE" });
      const body = (await res.json()) as { success?: boolean; error?: string };
      if (!body?.success) {
        setErr(body?.error ?? "Delete failed.");
        return;
      }
      void load();
    } catch {
      setErr("Network error.");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-wraptors-gold" /> Warranties
        </CardTitle>
        <p className="text-xs text-wraptors-muted">Coverage after completion</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-wraptors-gold" />
        ) : (
          <ul className="space-y-2">
            {rows.map((w) => (
              <li
                key={w.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-wraptors-border/60 px-3 py-2"
              >
                <div>
                  <p>{w.coverage_description}</p>
                  <p className="text-xs text-wraptors-muted mt-1">
                    Expires {formatDate(w.expires_at)}
                  </p>
                </div>
                {canEdit && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => void remove(w.id)}>
                    Remove
                  </Button>
                )}
              </li>
            ))}
            {rows.length === 0 && <p className="text-wraptors-muted text-sm">No warranties recorded.</p>}
          </ul>
        )}
        {canEdit && (
          <div className="space-y-2 border-t border-wraptors-border/50 pt-4">
            <div>
              <Label className="text-xs text-wraptors-muted">Coverage</Label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-1" placeholder="e.g. Film — 5 years" />
            </div>
            <div>
              <Label className="text-xs text-wraptors-muted">Expires</Label>
              <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className="mt-1" />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() => void addWarranty()}
              className="bg-wraptors-gold text-wraptors-black"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add warranty"}
            </Button>
          </div>
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
