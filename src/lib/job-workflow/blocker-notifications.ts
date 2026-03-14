/**
 * Blocker escalation notifications and copy.
 * Used after createBlockRequest / resolve / approve / deny to notify the right users.
 */

import type { OperationalBlockRequest, BlockTypeKey } from "@/types";
import type { StaffUser } from "@/types";
import { BLOCK_TYPE_LABELS, BLOCK_ESCALATION_ROLES } from "./config";
import { SHOP_ID } from "@/lib/constants";

export type NotificationPayload = {
  userId: string;
  type: "job_blocker" | "job_blocker_resolved";
  title: string;
  message: string;
  link: string;
};

/** Who to notify when a block is requested (role codes). Resolved at call site with staff list. */
export function getNotifyRoleKeysForBlockType(blockType: BlockTypeKey): ("receptionist" | "ceo")[] {
  return BLOCK_ESCALATION_ROLES[blockType] ?? ["receptionist"];
}

/** Resolve role keys to user IDs from staff (first user per role). */
export function getUserIdsForRoles(
  staff: StaffUser[],
  roles: ("receptionist" | "ceo")[]
): string[] {
  const ids = new Set<string>();
  for (const role of roles) {
    const normalized = role === "ceo" ? ["ceo", "admin"] : [role];
    const user = staff.find((s) => normalized.includes(s.role.toLowerCase()));
    if (user) ids.add(user.id);
  }
  return [...ids];
}

/** Build notifications for when a block is requested. */
export function buildBlockRequestedNotifications(
  request: OperationalBlockRequest,
  requestedByName: string,
  vehicleServiceSummary: string,
  staff: StaffUser[],
  jobId: string
): NotificationPayload[] {
  const roles = BLOCK_ESCALATION_ROLES[request.type] ?? ["receptionist"];
  let userIds = getUserIdsForRoles(staff, roles);
  userIds = userIds.filter((id) => id !== request.requestedBy);
  const label = BLOCK_TYPE_LABELS[request.type];
  const link = `/jobs/${jobId}`;

  const base: Omit<NotificationPayload, "userId"> = {
    type: "job_blocker",
    title: "",
    message: vehicleServiceSummary,
    link,
  };

  switch (request.type) {
    case "waiting_for_parts":
      base.title = `${requestedByName} blocked a job waiting for parts`;
      break;
    case "waiting_for_approval":
      base.title = `${requestedByName} has requested approval from you`;
      break;
    case "waiting_for_payment":
      base.title = "Payment required to continue";
      break;
    case "material_issue":
      base.title = "Material issue reported";
      break;
    case "rework_needed":
      base.title = "Rework reported";
      break;
    default:
      base.title = `${requestedByName} blocked the job — ${label}`;
  }

  return userIds.map((userId) => ({ ...base, userId }));
}

/** Build notification to technician when their request is resolved/approved/denied. */
export function buildTechnicianResolutionNotification(
  request: OperationalBlockRequest,
  resolvedByName: string,
  vehicleServiceSummary: string,
  technicianUserId: string,
  jobId: string
): NotificationPayload | null {
  const link = `/jobs/${jobId}`;
  let title = "";
  let message = vehicleServiceSummary;

  if (request.type === "waiting_for_approval") {
    if (request.status === "approved") {
      title = "Your approval request was approved";
      message = resolvedByName ? `Approved by ${resolvedByName}` : "Your request was approved.";
    } else if (request.status === "denied") {
      title = "Your approval request was denied";
      message = request.denialReason
        ? `Reason: ${request.denialReason}`
        : resolvedByName
          ? `Denied by ${resolvedByName}`
          : "Your request was denied.";
    }
  } else {
    switch (request.type) {
      case "waiting_for_parts":
        title = "Parts received — job unblocked";
        break;
      case "waiting_for_payment":
        title = "Payment confirmed — job unblocked";
        break;
      case "material_issue":
        title = "Material issue resolved";
        break;
      case "rework_needed":
        title = "Rework approved — job unblocked";
        break;
      default:
        title = "Block resolved — job unblocked";
    }
    message = resolvedByName ? `Resolved by ${resolvedByName}` : "The block has been resolved.";
  }

  return {
    userId: technicianUserId,
    type: "job_blocker_resolved",
    title,
    message,
    link,
  };
}

/** Format for notification item (addNotification expects Omit<NotificationItem, 'id'>). */
export function toNotificationItem(p: NotificationPayload): {
  shopId: string;
  userId: string;
  type: "job_blocker" | "job_blocker_resolved";
  title: string;
  message: string;
  read: boolean;
  link: string;
  createdAt: string;
} {
  return {
    shopId: SHOP_ID,
    userId: p.userId,
    type: p.type,
    title: p.title,
    message: p.message,
    read: false,
    link: p.link,
    createdAt: new Date().toISOString(),
  };
}
