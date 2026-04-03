import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const UpdateSettingsSchema = z.object({
  shop_name: z.string().min(1).optional(),
  shop_email: z.string().email().optional().nullable(),
  shop_phone: z.string().optional().nullable(),
  shop_address: z.string().optional().nullable(),
  shop_city: z.string().optional().nullable(),
  shop_province: z.string().optional().nullable(),
  shop_postal_code: z.string().optional().nullable(),
  shop_logo_url: z.string().optional().nullable(),
  shop_hours: z.record(z.any()).optional().nullable(),
  booking_lead_days: z.number().int().min(0).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).optional(),
})

export async function GET() {
  try {
    await requirePermission('settings.manage')
    const supabase = await createClient()
    const { data, error } = await supabase.from('shop_settings').select('*').limit(1).single()
    if (error) return errorResponse(error.message)
    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function PUT(request: Request) {
  try {
    await requirePermission('settings.manage')
    const parsed = await parseBody(request, UpdateSettingsSchema)
    if ('error' in parsed) return parsed.error

    const supabase = await createClient()
    const { data: existing } = await supabase.from('shop_settings').select('id').limit(1).single()

    const upsertResult = existing
      ? await supabase.from('shop_settings').update(parsed.data).eq('id', existing.id).select().single()
      : await supabase.from('shop_settings').insert(parsed.data).select().single()

    if (upsertResult.error) return errorResponse(upsertResult.error.message)
    return successResponse(upsertResult.data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
