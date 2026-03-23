import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { hasPermission } from '@/lib/auth/role-permissions'
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/helpers'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !hasPermission(currentUser.role, 'team.view')) {
      return unauthorizedResponse()
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('staff_users')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      return serverErrorResponse(error)
    }

    return successResponse(data ?? [])
  } catch (err) {
    return serverErrorResponse(err)
  }
}
