import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const CreateQuoteSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  vehicle_id: z.string().uuid().optional().nullable(),
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().optional().nullable(),
  services_requested: z.array(z.string()).default([]),
  source: z.enum(['app', 'website', 'phone', 'walk_in', 'meta_ads', 'referral', 'other']).default('phone'),
  notes: z.string().optional().nullable(),
  estimated_value: z.number().optional().nullable(),
})

export async function GET(request: Request) {
  try {
    await requirePermission('quotes.view')
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const page = Number.parseInt(searchParams.get('page') ?? '1', 10)
    const limit = Number.parseInt(searchParams.get('limit') ?? '50', 10)
    const offset = (page - 1) * limit

    let query = supabase
      .from('quote_requests')
      .select('*, customers(full_name, membership_status), vehicles(make, model, year)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (source) query = query.eq('source', source)

    const { data, error, count } = await query
    if (error) return errorResponse(error.message)
    return successResponse({ quotes: data ?? [], total: count ?? 0, page, limit })
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission('quotes.create')
    const parsed = await parseBody(request, CreateQuoteSchema)
    if ('error' in parsed) return parsed.error
    const supabase = await createClient()
    const { data, error } = await supabase.from('quote_requests').insert(parsed.data).select().single()
    if (error) return errorResponse(error.message)
    return successResponse(data, 201)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
