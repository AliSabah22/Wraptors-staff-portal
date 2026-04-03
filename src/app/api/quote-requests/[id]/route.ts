import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const UpdateQuoteSchema = z.object({
  status: z.enum(['new', 'contacted', 'quoted', 'accepted', 'declined', 'converted']).optional(),
  notes: z.string().optional().nullable(),
  estimated_value: z.number().optional().nullable(),
  converted_job_id: z.string().uuid().optional().nullable(),
})

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    await requirePermission('quotes.view')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*, customers(*), vehicles(*)')
      .eq('id', p.id)
      .single()
    if (error || !data) return notFoundResponse('Quote request')
    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    await requirePermission('quotes.edit')
    const parsed = await parseBody(request, UpdateQuoteSchema)
    if ('error' in parsed) return parsed.error

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quote_requests')
      .update(parsed.data)
      .eq('id', p.id)
      .select()
      .single()

    if (error || !data) return notFoundResponse('Quote request')
    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
