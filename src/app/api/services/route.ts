import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const ServiceSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['wrap', 'ppf', 'tint', 'detailing', 'other']),
  description: z.string().optional().nullable(),
  base_price: z.number().min(0),
  duration_hours: z.number().optional().nullable(),
  is_active: z.boolean().optional(),
})

export async function GET() {
  try {
    await requirePermission('services.view')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name')
    if (error) return errorResponse(error.message)
    return successResponse(data ?? [])
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission('services.create')
    const parsed = await parseBody(request, ServiceSchema)
    if ('error' in parsed) return parsed.error
    const supabase = await createClient()
    const { data, error } = await supabase.from('services').insert(parsed.data).select().single()
    if (error) return errorResponse(error.message)
    return successResponse(data, 201)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
