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

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !hasPermission(currentUser.role, 'team.manage')) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const parsed = InviteSchema.safeParse(body)
    if (!parsed.success) return errorResponse('Invalid input', 400)

    const supabase = createAdminClient()
    const { data: authUser, error: authError } = await supabase.auth.admin.inviteUserByEmail(
      parsed.data.email,
      { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password` }
    )

    if (authError || !authUser.user) return errorResponse(authError?.message ?? 'Failed to invite user', 400)

    const { data, error } = await supabase
      .from('staff_users')
      .insert({
        id: authUser.user.id,
        email: parsed.data.email,
        full_name: parsed.data.full_name,
        role: parsed.data.role,
        is_active: true,
      })
      .select()
      .single()

    if (error) return errorResponse(error.message, 400)
    return successResponse(data, 201)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
