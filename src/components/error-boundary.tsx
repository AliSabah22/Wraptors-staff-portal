"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

function isChunkLoadError(error: Error): boolean {
  const msg = error?.message ?? "";
  const name = (error as Error & { name?: string })?.name ?? "";
  return (
    name === "ChunkLoadError" ||
    msg.includes("ChunkLoadError") ||
    msg.includes("Loading chunk") ||
    msg.includes("Loading CSS chunk")
  );
}

/**
 * Catches render errors so the app shows a fallback instead of a blank screen.
 * ChunkLoadError triggers an auto-reload once (common after deploy or hot reload).
 */
export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("RootErrorBoundary caught error:", error, errorInfo.componentStack);
    if (this.state.isChunkError) {
      const key = "wraptors-chunk-reload";
      const alreadyReloaded = typeof sessionStorage !== "undefined" && sessionStorage.getItem(key);
      if (!alreadyReloaded) {
        try {
          sessionStorage.setItem(key, "1");
        } catch {
          // ignore
        }
        window.location.reload();
      }
    }
  }

  handleRefresh = () => {
    window.location.href = "/";
  };

  handleClearAndRefresh = () => {
    try {
      localStorage.removeItem("wraptors-auth");
      sessionStorage.removeItem("wraptors-chunk-reload");
    } catch {
      // ignore
    }
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      const chunkHint = this.state.isChunkError
        ? "A script failed to load (often after an update). Refreshing the page usually fixes it."
        : "The page failed to load. Try refreshing. If the problem continues, clear site data and reload.";
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-wraptors-black p-6 text-center">
          <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
          <p className="max-w-sm text-wraptors-muted">{chunkHint}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={this.handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh page
            </Button>
            <Button variant="outline" onClick={this.handleClearAndRefresh}>
              Clear data and refresh
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
