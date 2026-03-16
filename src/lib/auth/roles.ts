/**
 * Central role definitions for the staff portal.
 * Used for permission mapping, sidebar visibility, and route access.
 */

export const STAFF_ROLES = ["ceo", "receptionist", "technician"] as const;
export type StaffRoleCode = (typeof STAFF_ROLES)[number];

export const ROLE_LABELS: Record<StaffRoleCode, string> = {
  ceo: "CEO / Owner",
  receptionist: "Receptionist / Service Advisor",
  technician: "Technician",
};

export function getRoleLabel(role: StaffRoleCode): string {
  return ROLE_LABELS[role] ?? role;
}

/** Normalize legacy role names (e.g. admin, owner) to our three roles. */
export function normalizeRole(role: string): StaffRoleCode {
  const r = (role || "").toLowerCase();
  if (r === "admin" || r === "ceo" || r === "owner") return "ceo";
  if (r === "receptionist") return "receptionist";
  if (r === "technician") return "technician";
  if (r === "sales_manager") return "receptionist"; // map to receptionist for now
  return "technician"; // safe default
}
