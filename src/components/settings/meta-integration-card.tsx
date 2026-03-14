"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMetaIntegrationStore, usePipelineStore, useNotificationsStore, useTeamStore } from "@/stores";
import { META_PAGES, META_FORMS, getNextMockMetaLead } from "@/data/meta-leads-mock";
import { ingestMetaLeadIntoPipeline, getReceptionistUserId } from "@/lib/integrations/meta-leads";
import { Facebook, Check, ChevronDown, Zap } from "lucide-react";

let simulateIndex = 0;

export function MetaIntegrationCard() {
  const [simulating, setSimulating] = useState(false);
  const connected = useMetaIntegrationStore((s) => s.connected);
  const setConnected = useMetaIntegrationStore((s) => s.setConnected);
  const selectedPageId = useMetaIntegrationStore((s) => s.selectedPageId);
  const setSelectedPageId = useMetaIntegrationStore((s) => s.setSelectedPageId);
  const selectedFormIds = useMetaIntegrationStore((s) => s.selectedFormIds);
  const toggleFormId = useMetaIntegrationStore((s) => s.toggleFormId);
  const syncToPipelineEnabled = useMetaIntegrationStore((s) => s.syncToPipelineEnabled);
  const setSyncToPipelineEnabled = useMetaIntegrationStore((s) => s.setSyncToPipelineEnabled);

  const addLead = usePipelineStore((s) => s.addLead);
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const teamMembers = useTeamStore((s) => s.members);

  const selectedPage = META_PAGES.find((p) => p.id === selectedPageId);
  const selectedFormsList = META_FORMS.filter((f) => selectedFormIds.includes(f.id));

  const handleSimulate = () => {
    if (!syncToPipelineEnabled) return;
    setSimulating(true);
    const payload = getNextMockMetaLead(simulateIndex++);
    ingestMetaLeadIntoPipeline(payload, {
      addLead,
      addNotification,
      getReceptionistUserId,
      teamMembers,
    });
    setTimeout(() => setSimulating(false), 400);
  };

  return (
    <Card className="border-wraptors-border overflow-hidden">
      <CardHeader className="border-b border-wraptors-border/50 bg-wraptors-charcoal/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1877F2]/20">
              <Facebook className="h-5 w-5 text-[#1877F2]" />
            </div>
            <div>
              <CardTitle className="text-base">Meta / Facebook</CardTitle>
              <p className="text-xs text-wraptors-muted mt-0.5">
                Sync lead form submissions from Meta ads directly into your pipeline.
              </p>
            </div>
          </div>
          {connected ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => setConnected(false)}
            >
              <Check className="h-3.5 w-3.5" />
              Connected
            </Button>
          ) : (
            <Button
              size="sm"
              className="gap-1.5 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
              onClick={() => setConnected(true)}
            >
              Connect Meta
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {!connected ? (
          <p className="text-sm text-wraptors-muted">
            Connect your Meta Business account to sync lead form submissions into the pipeline. Receptionist will be notified for each new lead.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-wraptors-muted text-xs">Selected Facebook Page</Label>
              <Select value={selectedPageId ?? ""} onValueChange={(v) => setSelectedPageId(v || null)}>
                <SelectTrigger className="border-wraptors-border bg-wraptors-black/50">
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  {META_PAGES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-wraptors-muted text-xs">Lead forms to sync</Label>
              <div className="flex flex-wrap gap-2">
                {META_FORMS.map((form) => (
                  <Button
                    key={form.id}
                    type="button"
                    variant={selectedFormIds.includes(form.id) ? "default" : "outline"}
                    size="sm"
                    className={
                      selectedFormIds.includes(form.id)
                        ? "bg-wraptors-gold text-wraptors-black hover:bg-wraptors-gold/90"
                        : "border-wraptors-border"
                    }
                    onClick={() => toggleFormId(form.id)}
                  >
                    {form.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-wraptors-border/50 bg-wraptors-black/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-wraptors-muted-light">Sync Meta leads to Pipeline</p>
                <p className="text-xs text-wraptors-muted mt-0.5">New leads will appear in Pipeline under Lead stage</p>
              </div>
              <Select
                value={syncToPipelineEnabled ? "on" : "off"}
                onValueChange={(v) => setSyncToPipelineEnabled(v === "on")}
              >
                <SelectTrigger className="w-24 border-wraptors-border bg-wraptors-black/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on">On</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-wraptors-muted">
              <Badge variant="outline" className="border-wraptors-border text-wraptors-muted-light">
                {selectedPage?.name ?? "No page"}
              </Badge>
              <span>·</span>
              <span>{selectedFormIds.length} form{selectedFormIds.length !== 1 ? "s" : ""} selected</span>
              <span>·</span>
              <span>{syncToPipelineEnabled ? "Sync enabled" : "Sync disabled"}</span>
            </div>

            {syncToPipelineEnabled && (
              <div className="border-t border-wraptors-border/50 pt-4">
                <p className="text-xs font-medium text-wraptors-muted uppercase tracking-wider mb-2">Demo</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 border-wraptors-gold/50 text-wraptors-gold hover:bg-wraptors-gold/10"
                  onClick={handleSimulate}
                  disabled={simulating}
                >
                  <Zap className="h-3.5 w-3.5" />
                  {simulating ? "Added…" : "Simulate incoming Meta lead"}
                </Button>
                <p className="text-xs text-wraptors-muted mt-1.5">
                  Creates a sample lead in Pipeline and notifies the receptionist.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
