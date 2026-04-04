import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, serverErrorResponse } from '@/lib/api/helpers'

export const dynamic = 'force-dynamic'

const TERMINAL = '(completed,cancelled)'

export async function GET() {
  try {
    await requirePermission('jobs.view_operational')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('jobs')
      .select(
        `
        *,
        customers(id, full_name, phone),
        vehicles(id, make, model, year, color),
        staff_users!technician_id(id, full_name, role),
        job_media(id, type)
      `
      )
      .not('status', 'in', TERMINAL)
      .order('updated_at', { ascending: false })
      .limit(80)

    if (error) return serverErrorResponse(new Error(error.message))
    return successResponse({ jobs: data ?? [] })
  } catch (e) {
    return serverErrorResponse(e)
  }
}
