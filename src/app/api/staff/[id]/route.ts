import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { hasPermission } from '@/lib/auth/role-permissions'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse, notFoundResponse } from '@/lib/api/helpers'

const UpdateSchema = z.object({
  role: z.enum(['ceo', 'receptionist', 'technician']).optional(),
  is_active: z.boolean().optional(),
  full_name: z.string().min(2).optional(),
})

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    const currentUser = await getCurrentUser()
    if (!currentUser || !hasPermission(currentUser.role, 'team.manage')) {
      return unauthorizedResponse()
    }

    if (p.id === currentUser.id) {
      return errorResponse('You cannot modify your own account from here', 400)
    }

    const body = await request.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) return errorResponse('Invalid input', 400)

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('staff_users')
      .update(parsed.data)
      .eq('id', p.id)
      .select()
      .single()

    if (error || !data) return notFoundResponse('Staff member')
    return successResponse(data)
  } catch (err) {
    return serverErrorResponse(err)
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    const currentUser = await getCurrentUser()
    if (!currentUser || !hasPermission(currentUser.role, 'team.manage')) {
      return unauthorizedResponse()
    }

    if (p.id === currentUser.id) {
      return errorResponse('You cannot deactivate your own account', 400)
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('staff_users')
      .update({ is_active: false })
      .eq('id', p.id)
      .select()
      .single()

    if (error || !data) return notFoundResponse('Staff member')
    return successResponse(data)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
