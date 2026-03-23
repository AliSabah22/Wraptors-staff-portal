import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/auth/role-permissions'
import type { Permission } from '@/lib/auth/permissions'
import type { StaffRoleCode } from '@/lib/auth/roles'
import { normalizeRole } from '@/lib/auth/roles'

export interface StaffUserProfile {
  id: string
  email: string
  full_name: string
  role: StaffRoleCode
  avatar_url: string | null
  is_active: boolean
}

export async function getCurrentUser(): Promise<StaffUserProfile | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null
    }
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    let data: unknown = null

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Bypass RLS recursion/misconfig for staff profile lookups on server-side auth checks.
      const admin = createAdminClient()
      const { data: adminData } = await admin
        .from('staff_users')
        .select('id,email,full_name,role,avatar_url,is_active')
        .eq('id', user.id)
        .maybeSingle()
      data = adminData
    } else {
      const { data: userData } = await supabase
        .from('staff_users')
        .select('id,email,full_name,role,avatar_url,is_active')
        .eq('id', user.id)
        .maybeSingle()
      data = userData
    }

    if (!data) return null

    return {
      ...(data as Omit<StaffUserProfile, 'role'> & { role: string }),
      role: normalizeRole((data as { role: string }).role),
    }
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<StaffUserProfile> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.is_active === false) redirect('/login?reason=account_inactive')
  return user
}

export async function requireRole(role: StaffRoleCode): Promise<StaffUserProfile> {
  const user = await requireAuth()
  const hierarchy: StaffRoleCode[] = ['technician', 'receptionist', 'ceo']
  if (hierarchy.indexOf(user.role) < hierarchy.indexOf(role)) {
    redirect('/dashboard?error=unauthorized')
  }
  return user
}

export async function requirePermission(permission: Permission): Promise<StaffUserProfile> {
  const user = await requireAuth()
  if (!hasPermission(user.role, permission)) {
    redirect('/dashboard?error=unauthorized')
  }
  return user
}
