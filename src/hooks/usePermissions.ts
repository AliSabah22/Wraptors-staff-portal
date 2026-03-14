"use client";

import { useAuthStore } from "@/stores/auth";
import { normalizeRole } from "@/lib/auth/roles";
import { hasPermission as checkPermission } from "@/lib/auth/role-permissions";
import type { Permission } from "@/lib/auth/permissions";
import type { StaffRoleCode } from "@/lib/auth/roles";

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const role: StaffRoleCode = user ? normalizeRole(user.role) : "technician";

  const hasPermission = (permission: Permission): boolean => {
    return checkPermission(role, permission);
  };

  return { role, hasPermission };
}
