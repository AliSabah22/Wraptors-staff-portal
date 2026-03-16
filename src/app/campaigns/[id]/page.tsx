"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCampaignsStore, useAuthStore } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Pencil,
  Copy,
  Pause,
  Play,
  Archive,
  Smartphone,
  Mail,
  MessageSquare,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import type { Campaign, CampaignStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_VARIANTS: Record<CampaignStatus, "default" | "secondary" | "outline" | "success" | "warning"> = {
  draft: "secondary",
  scheduled: "outline",
  active: "default",
  paused: "warning",
  completed: "success",
  archived: "secondary",
};

function typeLabel(type: Campaign["type"]) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const getCampaignById = useCampaignsStore((s) => s.getCampaignById);
  const updateCampaign = useCampaignsStore((s) => s.updateCampaign);
  const duplicateCampaign = useCampaignsStore((s) => s.duplicateCampaign);
  const user = useAuthStore((s) => s.user);
  const { hasPermission } = usePermissions();

  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    setCampaign(getCampaignById(id) ?? null);
  }, [id, getCampaignById]);

  if (campaign === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-wraptors-muted">Campaign not found.</p>
        <Button variant="link" asChild>
          <Link href="/campaigns">Back to Campaigns</Link>
        </Button>
      </div>
    );
  }

  const canEdit = hasPermission("campaigns.edit");
  const canPublish = hasPermission("campaigns.publish");
  const showAnalytics =
    campaign.status === "active" ||
    campaign.status === "completed" ||
    campaign.status === "paused";
  const totalSent =
    campaign.mock_sent.in_app + campaign.mock_sent.email + campaign.mock_sent.sms;
  const conversions = Math.round(campaign.mock_clicks * 0.15);
  const avgOrder = 850;
  const estimatedRevenue = conversions * avgOrder;

  const handleDuplicate = () => {
    if (!user?.id) return;
    const copy = duplicateCampaign(campaign.id, user.id);
    if (copy) router.push(`/campaigns/${copy.id}/edit`);
  };

  const handlePauseResume = () => {
    const next =
      campaign.status === "active"
        ? "paused"
        : campaign.status === "paused"
          ? "active"
          : campaign.status;
    if (next !== campaign.status) updateCampaign(campaign.id, { status: next });
  };

  const handleArchive = () => {
    updateCampaign(campaign.id, { status: "archived" });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/campaigns">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-white truncate">
            {campaign.title || "Untitled campaign"}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_VARIANTS[campaign.status]}>
              {campaign.status === "active" && (
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              )}
              {campaign.status}
            </Badge>
            <span className="text-sm text-wraptors-muted">
              {typeLabel(campaign.type)}
              {campaign.target_label ? ` · ${campaign.target_label}` : ""}
            </span>
            <span className="text-sm text-wraptors-muted">
              {campaign.start_date} → {campaign.end_date}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {campaign.channels.in_app && (
            <span title="In-app"><Smartphone className="h-4 w-4 text-wraptors-gold" /></span>
          )}
          {campaign.channels.email && (
            <span title="Email"><Mail className="h-4 w-4 text-wraptors-gold" /></span>
          )}
          {campaign.channels.sms && (
            <span title="SMS"><MessageSquare className="h-4 w-4 text-wraptors-gold" /></span>
          )}
          {campaign.offer_code && (
            <span className="rounded bg-wraptors-gold/20 px-2 py-0.5 font-mono text-xs text-wraptors-gold">
              {campaign.offer_code}
            </span>
          )}
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/campaigns/${campaign.id}/edit`}>
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-1.5" />
            Duplicate
          </Button>
          {canPublish &&
            (campaign.status === "active" || campaign.status === "paused") && (
              <Button variant="outline" size="sm" onClick={handlePauseResume}>
                {campaign.status === "active" ? (
                  <>
                    <Pause className="h-4 w-4 mr-1.5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1.5" />
                    Resume
                  </>
                )}
              </Button>
            )}
          {canPublish &&
            campaign.status !== "archived" &&
            ["draft", "paused", "completed"].includes(campaign.status) && (
              <Button
                variant="outline"
                size="sm"
                className="text-wraptors-muted"
                onClick={handleArchive}
              >
                <Archive className="h-4 w-4 mr-1.5" />
                Archive
              </Button>
            )}
        </div>
      </div>

      {showAnalytics && (
        <Card className="border-wraptors-border">
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-wraptors-border bg-wraptors-charcoal/50 p-4">
                <p className="text-xs text-wraptors-muted uppercase">Total reached</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {campaign.mock_reach.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-wraptors-border bg-wraptors-charcoal/50 p-4">
                <p className="text-xs text-wraptors-muted uppercase">In-app sent</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {campaign.mock_sent.in_app.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-wraptors-border bg-wraptors-charcoal/50 p-4">
                <p className="text-xs text-wraptors-muted uppercase">Emails sent</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {campaign.mock_sent.email.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-wraptors-border bg-wraptors-charcoal/50 p-4">
                <p className="text-xs text-wraptors-muted uppercase">SMS sent</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {campaign.mock_sent.sms.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-wraptors-border bg-wraptors-charcoal/50 p-4">
                <p className="text-xs text-wraptors-muted uppercase">Opens</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {campaign.mock_opens.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-wraptors-border bg-wraptors-charcoal/50 p-4">
                <p className="text-xs text-wraptors-muted uppercase">Clicks</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {campaign.mock_clicks.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-wraptors-border bg-wraptors-charcoal/50 p-4">
                <p className="text-xs text-wraptors-muted uppercase">Est. conversions</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {conversions}
                </p>
              </div>
              <div className="rounded-lg border border-wraptors-border bg-wraptors-charcoal/50 p-4">
                <p className="text-xs text-wraptors-muted uppercase">Est. revenue</p>
                <p className="mt-1 text-2xl font-semibold text-wraptors-gold">
                  ${estimatedRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-wraptors-border">
        <CardHeader>
          <CardTitle>Offer preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md rounded-xl border border-wraptors-border bg-wraptors-surface p-4">
            <p className="text-xs text-wraptors-muted uppercase tracking-wider">
              {campaign.title || "Campaign"}
            </p>
            <h3 className="mt-1 text-lg font-bold text-white">
              {campaign.offer_headline}
            </h3>
            <p className="mt-2 text-sm text-wraptors-muted">{campaign.offer_body}</p>
            {campaign.offer_code && (
              <p className="mt-2 font-mono text-sm tracking-widest text-wraptors-gold uppercase">
                [ {campaign.offer_code} ]
              </p>
            )}
            <Button className="mt-3" size="sm" disabled>
              {campaign.offer_cta}
            </Button>
            {campaign.end_date && (
              <p className="mt-2 text-xs text-wraptors-muted">
                Expires {campaign.end_date}
              </p>
            )}
            {campaign.members_only && (
              <span className="mt-2 inline-block text-xs text-wraptors-gold">
                Members only
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-wraptors-border">
          <CardHeader>
            <CardTitle>Audience</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-wraptors-muted">
              {campaign.audience_type.replace(/_/g, " ")}
            </p>
            <p className="mt-1 text-wraptors-gold font-medium">
              Estimated reach: {campaign.mock_reach.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-wraptors-border">
          <CardHeader>
            <CardTitle>Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-wraptors-muted">
              {campaign.channels.in_app && (
                <li>In-app: {campaign.mock_sent.in_app.toLocaleString()} sent</li>
              )}
              {campaign.channels.email && (
                <li>Email: {campaign.mock_sent.email.toLocaleString()} sent</li>
              )}
              {campaign.channels.sms && (
                <li>SMS: {campaign.mock_sent.sms.toLocaleString()} sent</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
