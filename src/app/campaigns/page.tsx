"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  useCampaignsStore,
  useAuthStore,
} from "@/stores";
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
import {
  Megaphone,
  Plus,
  Search,
  Smartphone,
  Mail,
  MessageSquare,
  Eye,
  Pencil,
  Copy,
  Pause,
  Play,
  Archive,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import type { Campaign, CampaignStatus, CampaignType } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "product", label: "Product" },
  { value: "service", label: "Service" },
  { value: "category", label: "Category" },
  { value: "custom", label: "Custom" },
];

function statusBorderClass(status: CampaignStatus): string {
  switch (status) {
    case "draft":
      return "border-l-wraptors-muted";
    case "scheduled":
      return "border-l-sky-500/60";
    case "active":
      return "border-l-wraptors-gold";
    case "paused":
      return "border-l-amber-500/80";
    case "completed":
      return "border-l-emerald-500/50";
    case "archived":
      return "border-l-wraptors-muted/50 opacity-75";
    default:
      return "border-l-wraptors-border";
  }
}

function statusBadgeVariant(
  status: CampaignStatus
): "default" | "secondary" | "outline" | "success" | "warning" | "destructive" {
  switch (status) {
    case "active":
      return "default";
    case "draft":
      return "secondary";
    case "scheduled":
      return "outline";
    case "paused":
      return "warning";
    case "completed":
      return "success";
    case "archived":
      return "secondary";
    default:
      return "secondary";
  }
}

function typeLabel(type: CampaignType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatDateRange(start: string, end: string): string {
  const s = start.slice(0, 10);
  const e = end.slice(0, 10);
  return `${s} → ${e}`;
}

function CampaignsContent() {
  const router = useRouter();
  const campaigns = useCampaignsStore((s) => s.campaigns);
  const updateCampaign = useCampaignsStore((s) => s.updateCampaign);
  const duplicateCampaign = useCampaignsStore((s) => s.duplicateCampaign);
  const user = useAuthStore((s) => s.user);
  const { hasPermission } = usePermissions();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = campaigns;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.target_label.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (typeFilter !== "all") {
      list = list.filter((c) => c.type === typeFilter);
    }
    return list;
  }, [campaigns, search, statusFilter, typeFilter]);

  const canCreate = hasPermission("campaigns.create");
  const canPublish = hasPermission("campaigns.publish");

  const handleDuplicate = (c: Campaign) => {
    if (!user?.id) return;
    const copy = duplicateCampaign(c.id, user.id);
    if (copy) router.push(`/campaigns/${copy.id}/edit`);
  };

  const handlePauseResume = (c: Campaign) => {
    const next =
      c.status === "active" ? "paused" : c.status === "paused" ? "active" : c.status;
    if (next !== c.status) updateCampaign(c.id, { status: next });
  };

  const handleArchive = (c: Campaign) => {
    updateCampaign(c.id, { status: "archived" });
  };

  const isEmpty = campaigns.length === 0;
  const noResults = !isEmpty && filtered.length === 0;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-wraptors-muted mt-0.5">
            Create and manage promotional campaigns
          </p>
        </div>
        {canCreate && (
          <Button asChild className="gap-2">
            <Link href="/campaigns/new">
              <Plus className="h-4 w-4" /> Create Campaign
            </Link>
          </Button>
        )}
      </div>

      {!isEmpty && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wraptors-muted" />
            <Input
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {noResults && (
        <Card className="border-wraptors-border border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-wraptors-muted">
              No campaigns match your filters. Try different search or filters.
            </p>
          </CardContent>
        </Card>
      )}

      {isEmpty && (
        <Card className="border-wraptors-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-wraptors-gold/10 text-wraptors-gold mb-4">
              <Megaphone className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              No campaigns yet
            </h3>
            <p className="text-sm text-wraptors-muted mt-1 max-w-sm">
              Create your first campaign to promote offers to customers via
              in-app, email, and SMS.
            </p>
            {canCreate && (
              <Button asChild className="mt-6 gap-2">
                <Link href="/campaigns/new">
                  <Plus className="h-4 w-4" /> Create Campaign
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!isEmpty && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={cn(
                  "border-l-4 transition-colors hover:border-wraptors-border/80 hover:bg-wraptors-surface-hover/50",
                  statusBorderClass(c.status)
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white truncate">
                        {c.title || "Untitled campaign"}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {typeLabel(c.type)}
                        </Badge>
                        <Badge variant={statusBadgeVariant(c.status)}>
                          {c.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-wraptors-muted mt-1 truncate">
                        {c.target_label || "—"}
                      </p>
                      <p className="text-xs text-wraptors-muted mt-0.5">
                        {formatDateRange(c.start_date, c.end_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-wraptors-muted">
                      {c.channels.in_app && (
                        <span title="In-app">
                          <Smartphone className="h-4 w-4 text-wraptors-gold" />
                        </span>
                      )}
                      {c.channels.email && (
                        <span title="Email">
                          <Mail className="h-4 w-4 text-wraptors-gold" />
                        </span>
                      )}
                      {c.channels.sms && (
                        <span title="SMS">
                          <MessageSquare className="h-4 w-4 text-wraptors-gold" />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-wraptors-muted">
                      Reach: {c.mock_reach.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={`/campaigns/${c.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {hasPermission("campaigns.edit") && (
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/campaigns/${c.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDuplicate(c)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {canPublish &&
                        (c.status === "active" || c.status === "paused") && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handlePauseResume(c)}
                            title={c.status === "active" ? "Pause" : "Resume"}
                          >
                            {c.status === "active" ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      {canPublish &&
                        c.status !== "archived" &&
                        ["draft", "paused", "completed"].includes(c.status) && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleArchive(c)}
                            title="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}

export default function CampaignsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
            <p className="text-wraptors-muted mt-0.5">Loading…</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-wraptors-border animate-pulse">
              <CardContent className="p-5">
                <div className="h-5 w-3/4 rounded bg-wraptors-surface-hover" />
                <div className="mt-2 h-4 w-20 rounded bg-wraptors-surface-hover" />
                <div className="mt-2 h-4 w-full rounded bg-wraptors-surface-hover" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <CampaignsContent />
    </motion.div>
  );
}
