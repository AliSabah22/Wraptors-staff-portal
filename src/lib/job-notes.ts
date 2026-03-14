/**
 * Single place for deriving display notes from a job.
 * Prefers jobNotes; falls back to legacy notes[] as internal.
 */

import type { ServiceJob, JobNote } from "@/types";

export function getJobNotesForDisplay(job: ServiceJob): JobNote[] {
  if (job.jobNotes?.length) {
    return job.jobNotes;
  }
  return job.notes.map((text, i) => ({
    id: `legacy_${job.id}_${i}`,
    text,
    visibility: "internal" as const,
    createdAt: job.updatedAt,
    createdBy: undefined,
  }));
}
