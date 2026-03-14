/**
 * Job thread participants: who should be in the thread by role.
 * CEO, receptionist(s), and assigned technician.
 */

import type { ServiceJob } from "@/types";
import type { StaffUser } from "@/types";

export function getJobThreadParticipantIds(teamMembers: StaffUser[], job: ServiceJob): string[] {
  const ids = new Set<string>();
  teamMembers.forEach((m) => {
    const r = (m.role ?? "").toLowerCase();
    if (r === "ceo" || r === "admin") ids.add(m.id);
    if (r === "receptionist" || r === "sales_manager") ids.add(m.id);
  });
  if (job.assignedTechnicianId) ids.add(job.assignedTechnicianId);
  return [...ids];
}
