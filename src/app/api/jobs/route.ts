import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const CreateJobSchema = z.object({
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  technician_id: z.string().uuid().optional().nullable(),
  quote_request_id: z.string().uuid().optional().nullable(),
  services: z.array(z.string()).default([]),
  status: z
    .enum(['intake', 'in_progress', 'quality_check', 'ready_for_pickup', 'completed', 'cancelled'])
    .default('intake'),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  try {
    await requirePermission('jobs.view_operational')
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const technicianId = searchParams.get('technician_id')
    const customerId = searchParams.get('customer_id')
    const page = Number.parseInt(searchParams.get('page') ?? '1', 10)
    const limit = Number.parseInt(searchParams.get('limit') ?? '50', 10)
    const offset = (page - 1) * limit

    let query = supabase
      .from('jobs')
      .select(
        `
        *,
        customers(id, full_name, email, phone),
        vehicles(id, make, model, year, color),
        staff_users!technician_id(id, full_name, avatar_url)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (technicianId) query = query.eq('technician_id', technicianId)
    if (customerId) query = query.eq('customer_id', customerId)

    const { data, error, count } = await query
    if (error) return errorResponse(error.message)
    return successResponse({ jobs: data ?? [], total: count ?? 0, page, limit })
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission('jobs.create')
    const parsed = await parseBody(request, CreateJobSchema)
    if ('error' in parsed) return parsed.error

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('jobs')
      .insert({ ...parsed.data, created_by: user.id })
      .select('*, customers(full_name), vehicles(make, model, year)')
      .single()

    if (error) return errorResponse(error.message)
    return successResponse(data, 201)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
