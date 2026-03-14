/**
 * Central config for job workflow: status labels, blocker reasons, visibility, and options for UI.
 * Stage and transition rules live in stage-transitions.ts; types in @/types.
 */

import type { JobStatus, JobPriority, BlockTypeKey } from "@/types";
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

/** Predefined blocker reasons. Payment is CEO/receptionist only; technicians cannot set it. */
export const BLOCKER_REASON_PAYMENT_VALUE = "Waiting for payment";

/** Map canonical block type to human-readable label and legacy display reason. */
export const BLOCK_TYPE_LABELS: Record<BlockTypeKey, string> = {
  waiting_for_parts: "Waiting for parts",
  waiting_for_approval: "Waiting for approval",
  waiting_for_payment: "Waiting for payment",
  material_issue: "Material issue",
  rework_needed: "Rework needed",
};

/** Escalation: which roles to notify when this block type is requested. */
export const BLOCK_ESCALATION_ROLES: Record<BlockTypeKey, ("receptionist" | "ceo")[]> = {
  waiting_for_parts: ["receptionist"],
  waiting_for_approval: ["ceo"],
  waiting_for_payment: ["receptionist", "ceo"],
  material_issue: ["receptionist", "ceo"],
  rework_needed: ["receptionist", "ceo"],
};

/** UI options for block request modals. */
export const BLOCKER_REASON_OPTIONS: { value: string; label: string; shortLabel: string; blockType: BlockTypeKey }[] = [
  { value: "Waiting for parts", label: "Waiting for parts", shortLabel: "parts", blockType: "waiting_for_parts" },
  { value: "Waiting for approval", label: "Waiting for approval", shortLabel: "approval", blockType: "waiting_for_approval" },
  { value: BLOCKER_REASON_PAYMENT_VALUE, label: "Waiting for payment", shortLabel: "payment", blockType: "waiting_for_payment" },
  { value: "Material issue", label: "Material issue", shortLabel: "material", blockType: "material_issue" },
  { value: "Rework needed", label: "Rework needed", shortLabel: "rework", blockType: "rework_needed" },
];

export const PAYMENT_STAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "deposit", label: "Deposit" },
  { value: "final_payment", label: "Final payment" },
  { value: "additional_work", label: "Additional work" },
];

export const MATERIAL_ISSUE_OPTIONS: { value: string; label: string }[] = [
  { value: "damaged_material", label: "Damaged material" },
  { value: "wrong_material", label: "Wrong material" },
  { value: "insufficient_material", label: "Insufficient material" },
  { value: "quality_defect", label: "Quality defect" },
];

export const REWORK_REASON_OPTIONS: { value: string; label: string }[] = [
  { value: "installation_issue", label: "Installation issue" },
  { value: "defect_discovered", label: "Defect discovered" },
  { value: "alignment_problem", label: "Alignment problem" },
  { value: "customer_change_request", label: "Customer change request" },
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
