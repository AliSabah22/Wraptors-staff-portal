/**
 * Role-to-permission mapping.
 * Single source of truth for what each role can do.
 */

import type { Permission } from "./permissions";
import type { StaffRoleCode } from "./roles";

const CEO_PERMISSIONS: Permission[] = [
  "dashboard.view_full",
  "dashboard.view_operational",
  "dashboard.view_personal",
  "customers.view",
  "customers.create",
  "customers.edit",
  "customers.delete",
  "vehicles.view",
  "vehicles.create",
  "vehicles.edit",
  "jobs.view_all",
  "jobs.view_operational",
  "jobs.view_assigned",
  "jobs.create",
  "jobs.edit_basic",
  "jobs.assign",
  "jobs.update_status",
  "jobs.add_notes",
  "jobs.upload_media",
  "quotes.view",
  "quotes.create",
  "quotes.edit",
  "quotes.convert",
  "pipeline.view",
  "pipeline.edit",
  "calendar.view",
  "calendar.edit",
  "media.view",
  "media.view_assigned",
  "media.upload",
  "media.manage",
  "services.view",
  "services.create",
  "services.edit",
  "services.delete",
  "invoices.view",
  "invoices.manage",
  "analytics.view_full",
  "team.view",
  "team.manage",
  "notifications.view",
  "settings.manage",
  "permissions.manage",
  "audit_logs.view",
  "chat.view",
  "chat.send",
];

const RECEPTIONIST_PERMISSIONS: Permission[] = [
  "dashboard.view_operational",
  "customers.view",
  "customers.create",
  "customers.edit",
  "vehicles.view",
  "vehicles.create",
  "vehicles.edit",
  "jobs.view_operational",
  "jobs.create",
  "jobs.edit_basic",
  "jobs.assign",
  "quotes.view",
  "quotes.create",
  "quotes.edit",
  "quotes.convert",
  "pipeline.view",
  "pipeline.edit",
  "calendar.view",
  "calendar.edit",
  "media.view",
  "media.upload",
  "services.view",
  "notifications.view",
  "chat.view",
  "chat.send",
];

const TECHNICIAN_PERMISSIONS: Permission[] = [
  "dashboard.view_personal",
  "jobs.view_assigned",
  "jobs.update_status",
  "jobs.add_notes",
  "jobs.upload_media",
  "media.view_assigned",
  "media.upload",
  "notifications.view",
  "chat.view",
  "chat.send",
];

export const ROLE_PERMISSIONS: Record<StaffRoleCode, Permission[]> = {
  ceo: CEO_PERMISSIONS,
  receptionist: RECEPTIONIST_PERMISSIONS,
  technician: TECHNICIAN_PERMISSIONS,
};

const permissionSet = (perms: Permission[]) => new Set(perms);

const CEO_SET = permissionSet(CEO_PERMISSIONS);
const RECEPTIONIST_SET = permissionSet(RECEPTIONIST_PERMISSIONS);
const TECHNICIAN_SET = permissionSet(TECHNICIAN_PERMISSIONS);

export function getPermissionsForRole(role: StaffRoleCode): Set<Permission> {
  switch (role) {
    case "ceo":
      return CEO_SET;
    case "receptionist":
      return RECEPTIONIST_SET;
    case "technician":
      return TECHNICIAN_SET;
    default:
      return TECHNICIAN_SET;
  }
}

export function hasPermission(role: StaffRoleCode, permission: Permission): boolean {
  return getPermissionsForRole(role).has(permission);
}
