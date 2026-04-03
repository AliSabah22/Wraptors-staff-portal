import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const CreateCampaignSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['product', 'service', 'category', 'custom']),
  target_id: z.string().uuid().optional().nullable(),
  target_label: z.string().default(''),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'archived']).default('draft'),
  offer_headline: z.string().default(''),
  offer_body: z.string().default(''),
  offer_cta: z.string().default(''),
  offer_code: z.string().optional().nullable(),
  discount_type: z.enum(['percentage', 'fixed', 'none']).default('none'),
  discount_value: z.number().optional().nullable(),
  start_date: z.string(),
  end_date: z.string(),
  max_redemptions: z.number().int().optional().nullable(),
  members_only: z.boolean().default(false),
  audience_type: z
    .enum(['all_users', 'all_customers', 'previous_customers', 'members_only', 'service_history', 'manual'])
    .default('all_customers'),
  channels: z
    .object({
      in_app: z.boolean().default(true),
      email: z.boolean().default(false),
      sms: z.boolean().default(false),
    })
    .default({ in_app: true, email: false, sms: false }),
  ai_generated: z.boolean().default(false),
  mock_reach: z.number().default(0),
  mock_sent: z.object({ in_app: z.number(), email: z.number(), sms: z.number() }).default({ in_app: 0, email: 0, sms: 0 }),
  mock_opens: z.number().default(0),
  mock_clicks: z.number().default(0),
})

export async function GET(request: Request) {
  try {
    await requirePermission('campaigns.view')
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase.from('campaigns').select('*', { count: 'exact' }).order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) return errorResponse(error.message)
    return successResponse({ campaigns: data ?? [], total: count ?? 0 })
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission('campaigns.create')
    const parsed = await parseBody(request, CreateCampaignSchema)
    if ('error' in parsed) return parsed.error
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('campaigns')
      .insert({ ...parsed.data, created_by: user.id })
      .select()
      .single()
    if (error) return errorResponse(error.message)
    return successResponse(data, 201)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
