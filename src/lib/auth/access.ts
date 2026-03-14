/**
 * Route and action access control.
 * Maps routes to required permissions and provides scope helpers.
 */

import type { Permission } from "./permissions";
import type { StaffRoleCode } from "./roles";
import { hasPermission } from "./role-permissions";

/** Data scope for filtering what a role can see. */
export type DataScope = "all" | "operational" | "assigned" | "minimal" | "none";

/** Paths that require no permission (auth only). */
const PUBLIC_PATHS = ["/login"] as const;

/**
 * Map pathname (or path prefix) to the permission required to access that route.
 * First matching entry wins; order matters for prefix matches.
 */
export const ROUTE_PERMISSIONS: { path: string; permission: Permission }[] = [
  { path: "/", permission: "dashboard.view_full" },
  { path: "/dashboard", permission: "dashboard.view_full" },
  { path: "/dashboard/operations", permission: "dashboard.view_operational" },
  { path: "/dashboard/my-jobs", permission: "dashboard.view_personal" },
  { path: "/analytics", permission: "analytics.view_full" },
  { path: "/invoices", permission: "invoices.view" },
  { path: "/team", permission: "team.view" },
  { path: "/settings", permission: "settings.manage" },
  { path: "/customers", permission: "customers.view" },
  { path: "/jobs", permission: "jobs.view_operational" },
  { path: "/quote-requests", permission: "quotes.view" },
  { path: "/pipeline", permission: "pipeline.view" },
  { path: "/calendar", permission: "calendar.view" },
  { path: "/media", permission: "media.view" },
  { path: "/services", permission: "services.view" },
  { path: "/notifications", permission: "notifications.view" },
  { path: "/chat", permission: "chat.view" },
];

/**
 * Resolve which permission is required for a pathname.
 * Dashboard (/) is special: CEO needs dashboard.view_full, receptionist dashboard.view_operational, technician dashboard.view_personal.
 */
export function getRequiredPermissionForPath(pathname: string): Permission | null {
  if (PUBLIC_PATHS.some((p) => pathname === p)) return null;
  const exact = ROUTE_PERMISSIONS.find((r) => r.path === pathname);
  if (exact) return exact.permission;
  const prefix = ROUTE_PERMISSIONS.find((r) => r.path !== "/" && pathname.startsWith(r.path));
  return prefix ? prefix.permission : null;
}

/**
 * Check if a role can access the given pathname.
 * Dashboard: all three roles can access / with their own view.
 * Jobs: allow jobs.view_operational OR jobs.view_assigned.
 */
export function canAccessRoute(role: StaffRoleCode, pathname: string | null): boolean {
  if (pathname == null || pathname === "") return false;
  if (PUBLIC_PATHS.some((p) => pathname === p)) return true;
  if (pathname === "/") return true;
  // Single dashboard route: show role-appropriate view; all three roles can access.
  if (pathname === "/dashboard") {
    return (
      hasPermission(role, "dashboard.view_full") ||
      hasPermission(role, "dashboard.view_operational") ||
      hasPermission(role, "dashboard.view_personal")
    );
  }
  if (pathname === "/dashboard/operations") return hasPermission(role, "dashboard.view_operational");
  if (pathname === "/dashboard/my-jobs") return hasPermission(role, "dashboard.view_personal");
  if (pathname.startsWith("/jobs")) {
    return (
      hasPermission(role, "jobs.view_all") ||
      hasPermission(role, "jobs.view_operational") ||
      hasPermission(role, "jobs.view_assigned")
    );
  }
  if (pathname.startsWith("/media")) {
    return (
      hasPermission(role, "media.view") ||
      hasPermission(role, "media.view_assigned") ||
      hasPermission(role, "media.manage")
    );
  }
  const required = getRequiredPermissionForPath(pathname);
  if (!required) return false;
  return hasPermission(role, required);
}

/**
 * Default redirect path after login by role.
 */
export function getDefaultRedirectForRole(role: StaffRoleCode): string {
  // All roles land on /dashboard; the dashboard page renders the correct view per role.
  return "/dashboard";
}

/**
 * Path to redirect to when user has no access to the requested page.
 */
export function getUnauthorizedRedirect(role: StaffRoleCode): string {
  return getDefaultRedirectForRole(role);
}

/**
 * Role-specific dashboard path (for sidebar active state and redirects).
 */
export function getDashboardPathForRole(role: StaffRoleCode): string {
  return getDefaultRedirectForRole(role);
}

/**
 * Get data scope for a role (for filtering lists).
 */
export function getScopeForRole(role: StaffRoleCode): DataScope {
  switch (role) {
    case "ceo":
      return "all";
    case "receptionist":
      return "operational";
    case "technician":
      return "assigned";
    default:
      return "all"; // admin / unknown: show all jobs so calendar and lists are populated
  }
}

export function canPerformAction(
  role: StaffRoleCode,
  permission: Permission
): boolean {
  return hasPermission(role, permission);
}
