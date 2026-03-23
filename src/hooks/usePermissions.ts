'use client'

import type { Permission } from '@/lib/auth/permissions'
import { hasPermission as checkPermission } from '@/lib/auth/role-permissions'
import { useRole } from '@/hooks/useRole'

export function usePermissions() {
  const { role } = useRole()

  const hasPermission = (permission: Permission): boolean => {
    if (!role) return false
    return checkPermission(role, permission)
  }

  return { role, hasPermission }
}
