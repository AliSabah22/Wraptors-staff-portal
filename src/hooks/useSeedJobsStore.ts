"use client";

import { useEffect } from "react";
import type { ServiceJob } from "@/types";
import { useJobsStore } from "@/stores";

/** Applies server-fetched jobs after Zustand persist rehydration so localStorage does not win. */
export function useSeedJobsStore(jobs: ServiceJob[]) {
  useEffect(() => {
    const apply = () => useJobsStore.getState().setJobs(jobs);
    apply();
    return useJobsStore.persist.onFinishHydration(apply);
  }, [jobs]);
}

export function useMergeJobIntoJobsStore(job: ServiceJob | null) {
  useEffect(() => {
    if (!job) return;
    const apply = () => {
      const prev = useJobsStore.getState().jobs.filter((j) => j.id !== job.id);
      useJobsStore.setState({ jobs: [job, ...prev] });
    };
    apply();
    return useJobsStore.persist.onFinishHydration(apply);
  }, [job]);
}

export function useMergeJobsIntoStore(jobs: ServiceJob[]) {
  useEffect(() => {
    if (!jobs.length) return;
    const apply = () => {
      const ids = new Set(jobs.map((j) => j.id));
      const rest = useJobsStore.getState().jobs.filter((j) => !ids.has(j.id));
      useJobsStore.setState({ jobs: [...jobs, ...rest] });
    };
    apply();
    return useJobsStore.persist.onFinishHydration(apply);
  }, [jobs]);
}
