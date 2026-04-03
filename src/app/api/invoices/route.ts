import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'

export async function GET() {
  try {
    await requirePermission('invoices.view')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customers(full_name, email)')
      .order('created_at', { ascending: false })

    if (error) return errorResponse(error.message)
    return successResponse({ invoices: data ?? [] })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
