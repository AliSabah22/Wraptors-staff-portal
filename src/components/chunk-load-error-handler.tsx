"use client";

import { useEffect } from "react";

const RELOAD_KEY = "wraptors-chunk-reload";

function isChunkLoadError(message: string): boolean {
  return (
    message.includes("ChunkLoadError") ||
    message.includes("Loading chunk") ||
    message.includes("Loading CSS chunk") ||
    message.includes("Failed to fetch dynamically imported module")
  );
}

/**
 * Listens for unhandled ChunkLoadErrors (e.g. after deploy or hot reload)
 * and triggers a full page reload to recover. Clears the reload key after
 * successful load so a future chunk error can trigger another reload.
 */
export function ChunkLoadErrorHandler() {
  useEffect(() => {
    // Allow future ChunkLoadErrors to trigger reload after we've been mounted (successful load)
    const clearReloadKey = () => {
      try {
        sessionStorage.removeItem(RELOAD_KEY);
      } catch {
        // ignore
      }
    };
    const t = window.setTimeout(clearReloadKey, 3000);

    const handleError = (event: ErrorEvent) => {
      const msg = event.message ?? "";
      if (!isChunkLoadError(msg)) return;
      try {
        if (sessionStorage.getItem(RELOAD_KEY)) return;
        sessionStorage.setItem(RELOAD_KEY, "1");
      } catch {
        // ignore
      }
      event.preventDefault();
      window.location.reload();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = String(event.reason?.message ?? event.reason ?? "");
      if (!isChunkLoadError(msg)) return;
      try {
        if (sessionStorage.getItem(RELOAD_KEY)) return;
        sessionStorage.setItem(RELOAD_KEY, "1");
      } catch {
        // ignore
      }
      event.preventDefault();
      window.location.reload();
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
