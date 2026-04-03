import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const UpdateJobSchema = z.object({
  technician_id: z.string().uuid().optional().nullable(),
  services: z.array(z.string()).optional(),
  status: z
    .enum(['intake', 'in_progress', 'quality_check', 'ready_for_pickup', 'completed', 'cancelled'])
    .optional(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  deposit_paid: z.number().optional(),
  notes: z.string().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
})

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    await requirePermission('jobs.view_operational')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        customers(id, full_name, email, phone, membership_status),
        vehicles(id, make, model, year, color, vin),
        staff_users!technician_id(id, full_name, role, avatar_url),
        job_media(*),
        quote_requests(id, services_requested, estimated_value)
      `)
      .eq('id', p.id)
      .single()

    if (error || !data) return notFoundResponse('Job')
    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    await requirePermission('jobs.edit_basic')
    const parsed = await parseBody(request, UpdateJobSchema)
    if ('error' in parsed) return parsed.error

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('jobs')
      .update(parsed.data)
      .eq('id', p.id)
      .select('*, customers(full_name), vehicles(make, model, year)')
      .single()

    if (error || !data) return notFoundResponse('Job')
    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
