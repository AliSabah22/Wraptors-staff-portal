'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/context'
import type { StaffRoleCode } from '@/lib/auth/roles'

let currentUserRoleCache: StaffRoleCode | null = null

export function useCurrentUser() {
  const { user, staffUser, lockedRole, isAuthenticated, isLoading } = useAuth()
  const [stableRole, setStableRole] = useState<StaffRoleCode | null>(currentUserRoleCache)

  useEffect(() => {
    const nextRole = staffUser?.role ?? lockedRole ?? null
    if (!nextRole) return
    currentUserRoleCache = nextRole
    setStableRole(nextRole)
  }, [staffUser?.role, lockedRole])

  const role: StaffRoleCode = staffUser?.role ?? lockedRole ?? stableRole ?? 'technician'

  return {
    user: staffUser
      ? {
          id: staffUser.id,
          email: staffUser.email,
          name: staffUser.full_name,
          role: staffUser.role,
        }
      : null,
    authUser: user,
    role,
    isAuthenticated: () => isAuthenticated,
    isLoading,
  }
}
