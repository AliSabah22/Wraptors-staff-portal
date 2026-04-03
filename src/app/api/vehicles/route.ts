import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const CreateVehicleSchema = z.object({
  customer_id: z.string().uuid(),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().optional().nullable(),
  vin: z.string().optional().nullable(),
  license_plate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  try {
    await requirePermission('vehicles.view')
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customer_id')

    let query = supabase
      .from('vehicles')
      .select('*, customers(full_name, email)')
      .order('created_at', { ascending: false })

    if (customerId) query = query.eq('customer_id', customerId)

    const { data, error } = await query
    if (error) return errorResponse(error.message)
    return successResponse(data ?? [])
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission('vehicles.create')
    const parsed = await parseBody(request, CreateVehicleSchema)
    if ('error' in parsed) return parsed.error

    const supabase = await createClient()
    const { data, error } = await supabase.from('vehicles').insert(parsed.data).select().single()

    if (error) return errorResponse(error.message)
    return successResponse(data, 201)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
