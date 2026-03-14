/**
 * Central config for job workflow: status labels, blocker reasons, visibility, and options for UI.
 * Stage and transition rules live in stage-transitions.ts; types in @/types.
 */

import type { JobStatus, JobPriority } from "@/types";
import type { NoteVisibility } from "@/types";

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  active: "Active",
  blocked: "Blocked",
  on_hold: "On hold",
  ready_for_pickup: "Ready for pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Operational statuses that receptionist/operations can set directly. Blocked is set via blocker flow. */
export const RECEPTIONIST_SETTABLE_STATUSES: JobStatus[] = [
  "active",
  "on_hold",
  "ready_for_pickup",
  "completed",
  "cancelled",
];

export const JOB_PRIORITY_LABELS: Record<JobPriority, string> = {
  low: "Low",
  standard: "Standard",
  urgent: "Urgent",
  rush: "Rush",
};

/** Use for display/filter logic; accepts JobPriority or string from extended job shapes. */
export function isStandardPriority(priority: JobPriority | string | undefined): boolean {
  return !priority || priority === "standard";
}

/** Predefined blocker reasons for technician/receptionist use. */
export const BLOCKER_REASON_OPTIONS: { value: string; label: string; shortLabel: string }[] = [
  { value: "Waiting for parts", label: "Waiting for parts", shortLabel: "parts" },
  { value: "Waiting for approval", label: "Waiting for approval", shortLabel: "approval" },
  { value: "Waiting for payment", label: "Waiting for payment", shortLabel: "payment" },
  { value: "Material issue", label: "Material issue", shortLabel: "material" },
  { value: "Rework needed", label: "Rework needed", shortLabel: "rework" },
];

/** Shared visibility options for notes and media. */
export const VISIBILITY_OPTIONS: { value: NoteVisibility; label: string }[] = [
  { value: "internal", label: "Internal" },
  { value: "customer_visible", label: "Customer visible" },
];

/** Message shown when technician must add a photo before moving to a required-photo stage. */
export const REQUIRED_PHOTO_STAGE_MESSAGE =
  "Add at least one photo before moving to this stage, or ask receptionist/CEO to override.";

/** Stages used for at-risk calculation (early in workflow + due soon = at risk). */
export const EARLY_STAGES = ["intake", "inspection", "prep"] as const;
