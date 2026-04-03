import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    await requirePermission('notifications.view')
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (unreadOnly) query = query.eq('read', false)

    const { data, error } = await query
    if (error) return errorResponse(error.message)
    return successResponse(data ?? [])
  } catch (error) {
    return serverErrorResponse(error)
  }
}

const CreateNotificationSchema = z.object({
  user_id: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  link: z.string().optional().nullable(),
})

export async function POST(request: Request) {
  try {
    await requirePermission('team.manage')
    const parsed = await parseBody(request, CreateNotificationSchema)
    if ('error' in parsed) return parsed.error
    const supabase = await createClient()
    const { data, error } = await supabase.from('notifications').insert(parsed.data).select().single()
    if (error) return errorResponse(error.message)
    return successResponse(data, 201)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
