"use client";

import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ComingSoonCardProps {
  title: string;
  description: string;
  blockedBy: string;
  className?: string;
}

export function ComingSoonCard({ title, description, blockedBy, className }: ComingSoonCardProps) {
  return (
    <Card
      className={cn(
        "border border-dashed border-wraptors-gold/40 bg-wraptors-surface/60",
        className
      )}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-wraptors-gold/10 text-wraptors-gold">
          <Lock className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base text-white">{title}</CardTitle>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
              Pending setup
            </Badge>
          </div>
          <p className="text-sm text-wraptors-muted">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-wraptors-gold/90 border-l-2 border-wraptors-gold/50 pl-3">
          {blockedBy}
        </p>
      </CardContent>
    </Card>
  );
}
