"use client";

import { useEffect } from "react";

const RELOAD_KEY = "wraptors-chunk-reload";
const RELOAD_TIME_KEY = "wraptors-chunk-reload-time";

function isChunkLoadError(error: unknown): boolean {
  if (error == null) return false;
  const name = (error as Error).name ?? "";
  const msg = String((error as Error).message ?? error);
  return (
    name === "ChunkLoadError" ||
    msg.includes("ChunkLoadError") ||
    msg.includes("Loading chunk") ||
    msg.includes("loadChunk") ||
    msg.includes("Loading CSS chunk") ||
    msg.includes("Failed to fetch dynamically imported module")
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
        sessionStorage.removeItem(RELOAD_TIME_KEY);
      } catch {
        // ignore
      }
    };
    const t = window.setTimeout(clearReloadKey, 4000);

    const tryReload = () => {
      try {
        const lastReload = sessionStorage.getItem(RELOAD_TIME_KEY);
        const now = Date.now();
        if (lastReload && now - Number(lastReload) < 8000) {
          sessionStorage.removeItem(RELOAD_KEY);
          sessionStorage.removeItem(RELOAD_TIME_KEY);
          document.body.innerHTML =
            '<div style="font-family:system-ui;padding:2rem;max-width:480px;margin:2rem auto;background:#1a1a1a;color:#e5e5e5;border-radius:8px;">' +
            '<p style="margin:0 0 1rem;"><strong>Chunk load failed</strong></p>' +
            '<p style="margin:0 0 1rem;font-size:0.9rem;">The dev server may have rebuilt. Try:</p>' +
            '<ol style="margin:0 0 1rem;padding-left:1.25rem;font-size:0.9rem;">' +
            '<li>Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)</li>' +
            '<li>Stop other <code>npm run dev</code> terminals, then run <code>npm run dev</code> once</li>' +
            '<li>Clear site data for this origin and reload</li>' +
            '</ol>' +
            '<button type="button" onclick="location.reload()" style="padding:0.5rem 1rem;background:#d4af37;color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Retry</button>' +
            '</div>';
          return;
        }
        sessionStorage.setItem(RELOAD_KEY, "1");
        sessionStorage.setItem(RELOAD_TIME_KEY, String(now));
        window.location.reload();
      } catch {
        window.location.reload();
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (!isChunkLoadError(event.error ?? event.message)) return;
      event.preventDefault();
      event.stopPropagation();
      tryReload();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isChunkLoadError(event.reason)) return;
      event.preventDefault();
      tryReload();
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
