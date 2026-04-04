"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatJobStage } from "@/lib/utils";
import { dbJobStatusToJobStage } from "@/lib/server-data/hydration-mappers";

type LiveJobRow = Record<string, unknown> & {
  id: string;
  status?: string;
  updated_at?: string;
  customers?: { full_name?: string } | null;
  vehicles?: { make?: string; model?: string; year?: number } | null;
  staff_users?: { full_name?: string } | null;
  job_media?: { id: string; type?: string }[];
};

export function LiveBoardClient() {
  const [jobs, setJobs] = useState<LiveJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/dashboard/live-jobs");
      const body = (await res.json()) as {
        success?: boolean;
        data?: { jobs?: LiveJobRow[] };
        error?: string;
      };
      if (!body?.success || !body.data?.jobs) {
        setError(body?.error ?? "Could not load jobs.");
        return;
      }
      setJobs(body.data.jobs);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("live-jobs-board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-wraptors-muted">
        <Loader2 className="h-8 w-8 animate-spin text-wraptors-gold" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {jobs.map((j) => {
        const st = String(j.status ?? "intake");
        const stage = dbJobStatusToJobStage(st);
        const cust = j.customers?.full_name ?? "Customer";
        const v = j.vehicles;
        const veh = v ? `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim() : "Vehicle";
        const tech = j.staff_users?.full_name ?? "Unassigned";
        const mediaCount = Array.isArray(j.job_media) ? j.job_media.length : 0;
        const updated = j.updated_at ? new Date(String(j.updated_at)).toLocaleString() : "—";
        return (
          <Card key={j.id} className="border-wraptors-border bg-wraptors-surface">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-snug">{veh}</CardTitle>
                <Badge variant="outline">{st.replace(/_/g, " ")}</Badge>
              </div>
              <p className="text-xs text-wraptors-muted">{cust}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-wraptors-muted">
              <p>
                Stage: <span className="text-wraptors-gold">{formatJobStage(stage)}</span>
              </p>
              <p>Technician: {tech}</p>
              <p className="text-xs">Media files: {mediaCount}</p>
              <p className="text-xs">Updated {updated}</p>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/jobs/${j.id}`}>Open job</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
      {jobs.length === 0 && (
        <p className="text-sm text-wraptors-muted col-span-full">No active jobs on the floor.</p>
      )}
    </div>
  );
}
