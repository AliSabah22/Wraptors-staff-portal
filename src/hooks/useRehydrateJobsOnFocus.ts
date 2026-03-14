"use client";

import { useEffect } from "react";
import { useJobsStore } from "@/stores";

/**
 * Rehydrate the jobs store from localStorage when the window gains focus.
 * Ensures dashboard/calendar show updated "unscheduled" / "needing scheduling"
 * after editing jobs in another tab or after saving from the view job page.
 */
export function useRehydrateJobsOnFocus() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const rehydrate = () => {
      const persist = useJobsStore.persist;
      if (persist?.rehydrate) persist.rehydrate();
    };
    window.addEventListener("focus", rehydrate);
    return () => window.removeEventListener("focus", rehydrate);
  }, []);
}
