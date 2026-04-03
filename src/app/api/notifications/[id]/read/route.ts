import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    const user = await requireAuth()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', p.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return errorResponse(error.message)
    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
