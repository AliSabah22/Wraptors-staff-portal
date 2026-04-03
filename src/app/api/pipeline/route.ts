import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

export async function GET() {
  try {
    await requirePermission('pipeline.view')
    const supabase = await createClient()

    const { data: stages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (stagesError) return errorResponse(stagesError.message)

    const { data: items, error: itemsError } = await supabase
      .from('pipeline_items')
      .select(`
        *,
        quote_requests(
          id, customer_name, customer_email, services_requested,
          estimated_value, source, status, created_at,
          customers(full_name, membership_status),
          vehicles(make, model, year)
        ),
        jobs(
          id, status, price, start_date,
          customers(full_name, membership_status),
          vehicles(make, model, year)
        )
      `)
      .order('position', { ascending: true })

    if (itemsError) return errorResponse(itemsError.message)

    const board = (stages ?? []).map((stage) => ({
      ...stage,
      items: (items ?? []).filter((item) => item.stage_id === stage.id),
    }))

    return successResponse(board)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

const MoveItemSchema = z.object({
  item_id: z.string().uuid(),
  stage_id: z.string().uuid(),
  position: z.number().int().min(0).optional(),
})

export async function PUT(request: Request) {
  try {
    await requirePermission('pipeline.edit')
    const parsed = await parseBody(request, MoveItemSchema)
    if ('error' in parsed) return parsed.error

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('pipeline_items')
      .update({ stage_id: parsed.data.stage_id, position: parsed.data.position ?? 0 })
      .eq('id', parsed.data.item_id)
      .select()
      .single()

    if (error) return errorResponse(error.message)
    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
