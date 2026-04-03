import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/helpers'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    const user = await requirePermission('campaigns.create')
    const supabase = await createClient()

    const { data: original, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', p.id)
      .single()

    if (fetchError || !original) return notFoundResponse('Campaign')

    const { id, created_at, updated_at, published_at, scheduled_at, mock_reach, mock_sent, mock_opens, mock_clicks, ...rest } =
      original

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...rest,
        title: `${original.title} (Copy)`,
        status: 'draft',
        created_by: user.id,
        mock_reach: 0,
        mock_sent: { in_app: 0, email: 0, sms: 0 },
        mock_opens: 0,
        mock_clicks: 0,
      })
      .select()
      .single()

    if (error) return errorResponse(error.message)
    return successResponse(data, 201)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
