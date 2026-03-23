// lib/auth/supabase-helpers.ts
// Supabase-backed auth helpers for Server Components and Route Handlers.
// These complement the existing mock auth system (stores/auth.ts) and will
// replace it once Supabase is wired in. Call sites import from here — not
// from the mock layer — so the switch is a one-file change.
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import type { StaffRoleCode } from '@/lib/auth/roles'
import { normalizeRole } from '@/lib/auth/roles'

export interface SupabaseStaffUser {
  id: string
  email: string
  full_name: string
  role: StaffRoleCode
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/** Get the raw Supabase auth user (server-side). Returns null if unauthenticated. */
export async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ?? null
}

/** Get the staff profile for the currently authenticated user. */
export async function getCurrentStaffUser(): Promise<SupabaseStaffUser | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('staff_users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!data) return null
  return {
    ...(data as SupabaseStaffUser),
    role: normalizeRole((data as { role: string }).role),
  }
}

/** Require authentication — redirects to /login if not signed in. */
export async function requireAuth(): Promise<SupabaseStaffUser> {
  const user = await getCurrentStaffUser()
  if (!user) redirect('/login')
  return user
}

/** Require a minimum role level. Redirects to /dashboard?error=unauthorized if insufficient. */
export async function requireRole(minimumRole: StaffRoleCode): Promise<SupabaseStaffUser> {
  const user = await requireAuth()
  const hierarchy: StaffRoleCode[] = ['technician', 'receptionist', 'ceo']
  const userIdx = hierarchy.indexOf(user.role)
  const minIdx = hierarchy.indexOf(minimumRole)
  if (userIdx < minIdx) redirect('/dashboard?error=unauthorized')
  return user
}

/** Invite a new staff member via the admin client (bypasses RLS). */
export async function inviteStaffMember(email: string, role: StaffRoleCode, fullName: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, role },
  })
  return { data, error }
}
