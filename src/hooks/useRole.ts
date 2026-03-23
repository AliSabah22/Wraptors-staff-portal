'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/context'
import type { Permission } from '@/lib/auth/permissions'
import type { StaffRoleCode } from '@/lib/auth/roles'
import { hasPermission } from '@/lib/auth/role-permissions'

let roleCache: StaffRoleCode | null = null

export function useRole() {
  const { staffUser, lockedRole } = useAuth()
  const [stableRole, setStableRole] = useState<StaffRoleCode | null>(roleCache)

  useEffect(() => {
    const nextRole = staffUser?.role ?? lockedRole ?? null
    if (!nextRole) return
    roleCache = nextRole
    setStableRole(nextRole)
  }, [staffUser?.role, lockedRole])

  const role = (staffUser?.role ?? lockedRole ?? stableRole ?? null) as StaffRoleCode | null

  return {
    role,
    isCEO: role === 'ceo',
    isReceptionist: role === 'receptionist',
    isTechnician: role === 'technician',
    can: (permission: Permission) => (role ? hasPermission(role, permission) : false),
    isAtLeast: (minimum: StaffRoleCode) => {
      if (!role) return false
      const h: StaffRoleCode[] = ['technician', 'receptionist', 'ceo']
      return h.indexOf(role) >= h.indexOf(minimum)
    },
  }
}
