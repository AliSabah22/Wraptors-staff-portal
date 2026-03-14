"use client";

import { useEffect, useState } from "react";
import { useJobsStore } from "@/stores";

/**
 * Returns jobs for tracking (Needing scheduling / Unscheduled jobs) and a key that
 * increments whenever the jobs array reference changes. Use the key in useMemo deps
 * so the derived list always updates after store updates or rehydration.
 */
export function useJobsForTracking() {
  const jobs = useJobsStore((s) => s.jobs) ?? [];
  const [trackingKey, setTrackingKey] = useState(0);

  useEffect(() => {
    let prevJobs = useJobsStore.getState().jobs;
    const unsub = useJobsStore.subscribe((state) => {
      if (state.jobs !== prevJobs) {
        prevJobs = state.jobs;
        setTrackingKey((k) => k + 1);
      }
    });
    return unsub;
  }, []);

  return { jobs: Array.isArray(jobs) ? jobs : [], trackingKey };
}
