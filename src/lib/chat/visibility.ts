import type { StaffRoleCode } from "@/lib/auth/roles";
import type { ChatThread } from "@/types";
import type { ServiceJob } from "@/types";
import type { StaffUser } from "@/types";
import { getScopeForRole } from "@/lib/auth/access";
import { getChannelsForRole, getChannelByKey } from "./channels";
import { normalizeRole } from "@/lib/auth/roles";

/**
 * Returns whether the current user can see this thread based on role and job access.
 * - Job threads: CEO all, Receptionist all, Technician only assigned jobs.
 * - DM: user must be in participantIds.
 * - Channel: user's role must be in channel's allowedRoles.
 */
export function canUserSeeThread(
  thread: ChatThread,
  currentUserId: string,
  role: StaffRoleCode,
  getJobById: (id: string) => ServiceJob | undefined
): boolean {
  if (thread.type === "dm") {
    return thread.participantIds.includes(currentUserId);
  }
  if (thread.type === "channel") {
    const allowed = getChannelsForRole(role as "ceo" | "receptionist" | "technician");
    return thread.channelKey != null && allowed.some((c) => c.key === thread.channelKey);
  }
  if (thread.type === "job" && thread.jobId) {
    const job = getJobById(thread.jobId);
    if (!job) return false;
    const scope = getScopeForRole(role);
    if (scope === "all") return true;
    if (scope === "operational") return true; // receptionist sees all operational job threads
    if (scope === "assigned") return job.assignedTechnicianId === currentUserId;
    return false;
  }
  return false;
}

/**
 * Filter threads to only those visible to the current user.
 */
export function getVisibleThreads(
  threads: ChatThread[],
  currentUserId: string,
  role: StaffRoleCode,
  getJobById: (id: string) => ServiceJob | undefined
): ChatThread[] {
  return threads.filter((t) => canUserSeeThread(t, currentUserId, role, getJobById));
}

/**
 * Get user IDs that should be notified for @everyone in this thread.
 * Job/DM: thread.participantIds. Channel: all staff whose role can access the channel.
 */
export function getEveryoneUserIdsForThread(
  thread: ChatThread,
  teamMembers: StaffUser[]
): string[] {
  if (thread.type === "job" || thread.type === "dm") {
    return [...thread.participantIds];
  }
  if (thread.type === "channel" && thread.channelKey) {
    const channel = getChannelByKey(thread.channelKey);
    if (!channel) return [];
    return teamMembers
      .filter((m) => channel.allowedRoles.includes(normalizeRole(m.role) as "ceo" | "receptionist" | "technician"))
      .map((m) => m.id);
  }
  return [];
}
