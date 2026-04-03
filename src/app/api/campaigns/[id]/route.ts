import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const UpdateCampaignSchema = z
  .object({
    title: z.string().optional(),
    status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'archived']).optional(),
    offer_headline: z.string().optional(),
    offer_body: z.string().optional(),
    offer_cta: z.string().optional(),
    offer_code: z.string().optional().nullable(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    published_at: z.string().optional().nullable(),
    scheduled_at: z.string().optional().nullable(),
    mock_reach: z.number().optional(),
    mock_sent: z.object({ in_app: z.number(), email: z.number(), sms: z.number() }).optional(),
    mock_opens: z.number().optional(),
    mock_clicks: z.number().optional(),
  })
  .passthrough()

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    await requirePermission('campaigns.view')
    const supabase = await createClient()
    const { data, error } = await supabase.from('campaigns').select('*').eq('id', p.id).single()
    if (error || !data) return notFoundResponse('Campaign')
    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    await requirePermission('campaigns.edit')
    const parsed = await parseBody(request, UpdateCampaignSchema)
    if ('error' in parsed) return parsed.error
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('campaigns')
      .update(parsed.data)
      .eq('id', p.id)
      .select()
      .single()
    if (error || !data) return notFoundResponse('Campaign')
    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
