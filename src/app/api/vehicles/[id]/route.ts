import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const UpdateVehicleSchema = z.object({
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1900).optional(),
  color: z.string().optional().nullable(),
  vin: z.string().optional().nullable(),
  license_plate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    await requirePermission('vehicles.view')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, customers(full_name, email), jobs(id, status, created_at)')
      .eq('id', p.id)
      .single()
    if (error || !data) return notFoundResponse('Vehicle')
    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    await requirePermission('vehicles.edit')
    const parsed = await parseBody(request, UpdateVehicleSchema)
    if ('error' in parsed) return parsed.error

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vehicles')
      .update(parsed.data)
      .eq('id', p.id)
      .select()
      .single()

    if (error || !data) return notFoundResponse('Vehicle')
    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    await requirePermission('vehicles.edit')
    const supabase = await createClient()
    const { error } = await supabase.from('vehicles').delete().eq('id', p.id)
    if (error) return notFoundResponse('Vehicle')
    return successResponse({ deleted: true })
  } catch (error) {
    return serverErrorResponse(error)
  }
}
