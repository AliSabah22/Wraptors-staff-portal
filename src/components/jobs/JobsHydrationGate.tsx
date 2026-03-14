"use client";

import { useEffect, useState } from "react";
import { useJobsStore } from "@/stores";

/**
 * Renders children only after the jobs store has finished its first hydration from localStorage.
 * This prevents a race where the user updates a job and then the initial (async) hydration
 * overwrites the in-memory state with stale data from before the update.
 */
export function JobsHydrationGate({ children }: { children: React.ReactNode }) {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const persist = useJobsStore.persist;
    if (!persist) {
      setHasHydrated(true);
      return;
    }
    if (persist.hasHydrated?.()) {
      setHasHydrated(true);
      return;
    }
    const unsub = persist.onFinishHydration?.(() => setHasHydrated(true));
    return () => unsub?.();
  }, []);

  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-wraptors-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-wraptors-gold border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
