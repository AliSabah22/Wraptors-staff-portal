import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { hasPermission } from '@/lib/auth/role-permissions'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/helpers'

const InviteSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  role: z.enum(['ceo', 'receptionist', 'technician']),
})

/** Valid absolute origin for Supabase invite redirectTo (must match Auth URL allow-list). */
function inviteRedirectOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '') ?? ''
  if (explicit.startsWith('http://') || explicit.startsWith('https://')) {
    return explicit
  }
  const vercel = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//, '') ?? ''
  if (vercel) return `https://${vercel}`
  return 'http://localhost:3000'
}

/** GoTrue may return `{ user }` or a user-shaped object depending on version; normalize to id. */
function invitedAuthUserId(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>
  if (typeof o.id === 'string' && o.id.length > 0) return o.id
  const u = o.user
  if (u && typeof u === 'object') {
    const id = (u as { id?: unknown }).id
    if (typeof id === 'string' && id.length > 0) return id
  }
  return null
}

function isDuplicateAuthError(message: string): boolean {
  return /already (been )?registered|already exists|user already|duplicate/i.test(message)
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !hasPermission(currentUser.role, 'team.manage')) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const parsed = InviteSchema.safeParse(body)
    if (!parsed.success) return errorResponse('Invalid input', 400)

    const email = parsed.data.email.trim().toLowerCase()
    const supabase = createAdminClient()

    const origin = inviteRedirectOrigin()
    const redirectTo = `${origin}/reset-password`

    const { data: invitePayload, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { full_name: parsed.data.full_name },
    })

    if (authError) {
      const msg = authError.message ?? 'Failed to invite user'
      if (isDuplicateAuthError(msg)) {
        return errorResponse('A user with this email already exists', 409)
      }
      return errorResponse(msg, 400)
    }

    const newUserId = invitedAuthUserId(invitePayload)
    if (!newUserId) {
      return errorResponse('Failed to invite user — no user id returned from auth', 500)
    }

    const { data, error } = await supabase
      .from('staff_users')
      .insert({
        id: newUserId,
        email,
        full_name: parsed.data.full_name,
        role: parsed.data.role,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(newUserId)
      if (delErr) {
        console.error('[staff/invite] rollback deleteUser failed:', delErr.message)
      }
      return errorResponse(`Failed to create staff profile: ${error.message}`, 400)
    }

    return successResponse(data, 201)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
