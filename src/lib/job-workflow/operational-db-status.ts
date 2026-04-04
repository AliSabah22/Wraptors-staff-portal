import type { JobStatus } from "@/types";

/** Map receptionist operational status to Supabase `jobs.status`. */
export function operationalStatusToDbStatus(
  op: JobStatus,
  currentDb: string | undefined
): string {
  const cur = currentDb && currentDb.length > 0 ? currentDb : "intake";
  switch (op) {
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    case "ready_for_pickup":
      return "ready_for_pickup";
    case "on_hold":
      return "quality_check";
    case "active": {
      if (cur === "cancelled") return "intake";
      if (cur === "completed" || cur === "ready_for_pickup") return "in_progress";
      if (cur === "quality_check") return "in_progress";
      if (cur === "intake" || cur === "in_progress") return cur;
      return "in_progress";
    }
    default:
      return cur;
  }
}
