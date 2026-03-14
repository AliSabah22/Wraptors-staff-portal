/**
 * Scoped data access helpers.
 * Filter lists and check single-item access by role/scope.
 */

import type { StaffRoleCode } from "@/lib/auth/roles";
import { getScopeForRole } from "@/lib/auth/access";
import { hasPermission } from "@/lib/auth/role-permissions";
import type { ServiceJob } from "@/types";
import type { Customer } from "@/types";
import type { MediaAsset } from "@/types";

export function getScopedJobs(
  role: StaffRoleCode,
  userId: string | undefined,
  jobs: ServiceJob[]
): ServiceJob[] {
  const scope = getScopeForRole(role);
  if (scope === "all") return jobs;
  if (scope === "operational") return jobs; // receptionist sees all operational
  if (scope === "assigned" && userId) {
    return jobs.filter((j) => j.assignedTechnicianId === userId);
  }
  return [];
}

export function canAccessJob(
  role: StaffRoleCode,
  userId: string | undefined,
  job: ServiceJob
): boolean {
  const scope = getScopeForRole(role);
  if (scope === "all") return true;
  if (scope === "operational") return true;
  if (scope === "assigned" && userId) {
    return job.assignedTechnicianId === userId;
  }
  return false;
}

export function getScopedCustomers(
  role: StaffRoleCode,
  customers: Customer[]
): Customer[] {
  const scope = getScopeForRole(role);
  if (scope === "all" || scope === "operational") return customers;
  return []; // technician has no customer list access
}

export function canAccessCustomer(role: StaffRoleCode): boolean {
  const scope = getScopeForRole(role);
  return scope === "all" || scope === "operational";
}

/**
 * Returns media items visible to the current role/user.
 * - CEO / receptionist (media.view or media.manage): all items.
 * - Technician (media.view_assigned only): items linked to assigned jobs or uploaded by user.
 */
export function getScopedMedia(
  role: StaffRoleCode,
  userId: string | undefined,
  items: MediaAsset[],
  jobs: ServiceJob[]
): MediaAsset[] {
  if (hasPermission(role, "media.view") || hasPermission(role, "media.manage")) {
    return items;
  }
  if (hasPermission(role, "media.view_assigned") && userId) {
    const assignedJobIds = new Set(
      jobs.filter((j) => j.assignedTechnicianId === userId).map((j) => j.id)
    );
    return items.filter(
      (m) =>
        (m.jobId != null && assignedJobIds.has(m.jobId)) ||
        m.uploadedBy === userId
    );
  }
  return [];
}
