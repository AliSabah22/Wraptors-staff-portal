"use client";

import { useEffect } from "react";

const isChunkLoadError = (e: Error) =>
  e?.name === "ChunkLoadError" || /Loading chunk [\d]+ failed/i.test(e?.message ?? "");

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const chunkError = isChunkLoadError(error);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center bg-wraptors-black">
      <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
      <p className="max-w-md text-sm text-wraptors-muted">
        {chunkError
          ? "A page chunk failed to load. This often happens after a deploy or with a slow connection. Try again or do a full refresh (Ctrl+Shift+R / Cmd+Shift+R)."
          : error.message}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-wraptors-gold text-wraptors-black font-medium hover:opacity-90"
        >
          Try again
        </button>
        {chunkError && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg border border-wraptors-border text-white font-medium hover:bg-wraptors-charcoal"
          >
            Full refresh
          </button>
        )}
      </div>
    </div>
  );
}
