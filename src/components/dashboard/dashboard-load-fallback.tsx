"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function DashboardLoadFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6">
      <AlertCircle className="h-12 w-12 text-amber-500" />
      <p className="text-center text-wraptors-muted">
        Dashboard failed to load. This can happen after an update or a weak connection.
      </p>
      <Button onClick={onRetry} size="sm">
        Retry
      </Button>
    </div>
  );
}

function retryReload() {
  window.location.reload();
}

export function makeDashboardErrorComponent() {
  return function DashboardLoadError() {
    return <DashboardLoadFallback onRetry={retryReload} />;
  };
}
