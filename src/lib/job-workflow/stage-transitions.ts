/**
 * Job stage transition rules.
 * Technicians can only move to allowed next (or previous) stages;
 * receptionist/CEO may have override capability.
 */

import type { JobStage } from "@/types";
import { JOB_STAGES } from "@/types";
import type { StaffRoleCode } from "@/lib/auth/roles";

/** Allowed next stages from each stage (forward only for technicians). */
export const ALLOWED_NEXT_STAGES: Record<JobStage, JobStage[]> = {
  intake: ["inspection"],
  inspection: ["prep", "intake"],
  prep: ["disassembly", "inspection"],
  disassembly: ["installation", "prep"],
  installation: ["reassembly", "disassembly"],
  reassembly: ["inspection_final", "installation"],
  inspection_final: ["media", "reassembly"],
  media: ["ready", "inspection_final"],
  ready: ["media"],
};

/** Stages that require at least one photo before transition completes (high-value checkpoints). */
export const STAGES_REQUIRING_PHOTO: Set<JobStage> = new Set([
  "inspection",      // vehicle accepted / intake condition
  "prep",            // disassembly or prep checkpoint
  "installation",    // installation progress
  "inspection_final", // final inspection
  "ready",           // delivery / ready photos
]);

/** Index of each stage for ordering. */
const STAGE_INDEX: Record<JobStage, number> = JOB_STAGES.reduce(
  (acc, stage, i) => ({ ...acc, [stage]: i }),
  {} as Record<JobStage, number>
);

export function getAllowedNextStages(currentStage: JobStage): JobStage[] {
  return ALLOWED_NEXT_STAGES[currentStage] ?? [];
}

/** Returns true if the transition is allowed. Technicians are restricted; CEO/receptionist can override in UI. */
export function canTransitionTo(
  currentStage: JobStage,
  nextStage: JobStage,
  role: StaffRoleCode
): boolean {
  if (role === "ceo" || role === "receptionist") return true;
  const allowed = ALLOWED_NEXT_STAGES[currentStage];
  if (!allowed?.length) return false;
  return allowed.includes(nextStage);
}

export function stageRequiresPhoto(stage: JobStage): boolean {
  return STAGES_REQUIRING_PHOTO.has(stage);
}

export function getStageIndex(stage: JobStage): number {
  return STAGE_INDEX[stage] ?? -1;
}

export function isForwardTransition(from: JobStage, to: JobStage): boolean {
  return getStageIndex(to) > getStageIndex(from);
}
