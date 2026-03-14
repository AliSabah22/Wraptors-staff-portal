"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp } from "lucide-react";

/**
 * POST-LAUNCH: Weekly Business Briefing generation and scheduling.
 * POST-LAUNCH: Revenue Opportunity Spotter feed.
 */
export function ComingSoonCards() {
  return (
    <div className="space-y-4">
      <Card className="border-wraptors-border bg-wraptors-surface opacity-90">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <FileText className="h-5 w-5 text-wraptors-muted" />
            <Badge variant="warning" className="shrink-0">
              Coming Soon
            </Badge>
          </div>
          <CardTitle className="text-base">Weekly Business Briefing</CardTitle>
          <CardDescription className="text-sm">
            Every Monday, an AI-generated summary of your shop&apos;s performance — revenue, pipeline health,
            technician utilization, and upcoming risks.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card className="border-wraptors-border bg-wraptors-surface opacity-90">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-5 w-5 text-wraptors-muted" />
            <Badge variant="warning" className="shrink-0">
              Coming Soon
            </Badge>
          </div>
          <CardTitle className="text-base">Revenue Opportunity Spotter</CardTitle>
          <CardDescription className="text-sm">
            Proactive AI insights that surface upsell gaps, dormant customers, pricing anomalies, and
            seasonal opportunities before you miss them.
          </CardDescription>
        </CardHeader>
      </Card>
      <p className="text-xs text-wraptors-muted pt-2">
        These features unlock as your portal builds operational history. The more your team uses the
        portal, the smarter these insights become.
      </p>
    </div>
  );
}
