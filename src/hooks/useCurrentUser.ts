"use client";

import { useAuthStore } from "@/stores/auth";
import { normalizeRole } from "@/lib/auth/roles";
import type { StaffRoleCode } from "@/lib/auth/roles";

export function useCurrentUser() {
  const user = useAuthStore((s) => s.user);
  const role: StaffRoleCode = user ? normalizeRole(user.role) : "technician";
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return {
    user,
    role,
    isAuthenticated,
  };
}
