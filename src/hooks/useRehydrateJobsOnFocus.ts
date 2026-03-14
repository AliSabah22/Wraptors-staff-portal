"use client";

import { useEffect } from "react";
import { useJobsStore } from "@/stores";

function rehydrateJobs() {
  const persist = useJobsStore.persist;
  if (persist?.rehydrate) persist.rehydrate();
}

/**
 * Rehydrate the jobs store from localStorage so dashboard/calendar tracking
 * ("Needing scheduling", "Unscheduled jobs") stays in sync. Runs:
 * - When the window gains focus (e.g. after editing in another tab)
 * - When the document becomes visible (tab switched back)
 * - Once when the component mounts (e.g. when navigating to dashboard/calendar)
 */
export function useRehydrateJobsOnFocus() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    rehydrateJobs();
    const onFocus = () => rehydrateJobs();
    const onVisibility = () => {
      if (document.visibilityState === "visible") rehydrateJobs();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}
