import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const PostSchema = z.object({
  acknowledge: z.literal(true),
})

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    if (!token) return errorResponse('Missing token', 400)

    const admin = createAdminClient()
    const { data: row, error } = await admin
      .from('vehicle_condition_reports')
      .select('id, zones, acknowledged_at, acknowledgment_token_expires_at')
      .eq('acknowledgment_token', token)
      .maybeSingle()

    if (error) return errorResponse(error.message)
    if (!row) return notFoundResponse('Report')

    const r = row as Record<string, unknown>
    const exp = r.acknowledgment_token_expires_at != null ? String(r.acknowledgment_token_expires_at) : null
    if (exp && new Date(exp).getTime() < Date.now() && !r.acknowledged_at) {
      return errorResponse('This acknowledgment link has expired.', 410)
    }

    return successResponse({
      acknowledged: !!r.acknowledged_at,
      zones: r.zones,
    })
  } catch (e) {
    return serverErrorResponse(e)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const parsed = await parseBody(request, PostSchema)
    if ('error' in parsed) return parsed.error

    const admin = createAdminClient()
    const { data: row, error: fetchErr } = await admin
      .from('vehicle_condition_reports')
      .select('id, acknowledged_at, acknowledgment_token_expires_at')
      .eq('acknowledgment_token', token)
      .maybeSingle()

    if (fetchErr) return errorResponse(fetchErr.message)
    if (!row) return notFoundResponse('Report')

    const r = row as Record<string, unknown>
    if (r.acknowledged_at) {
      return successResponse({ acknowledged: true, already: true })
    }
    const exp = r.acknowledgment_token_expires_at != null ? String(r.acknowledgment_token_expires_at) : null
    if (exp && new Date(exp).getTime() < Date.now()) {
      return errorResponse('This acknowledgment link has expired.', 410)
    }

    const { error: upErr } = await admin
      .from('vehicle_condition_reports')
      .update({
        acknowledged_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', String(r.id ?? ''))

    if (upErr) return errorResponse(upErr.message)
    return successResponse({ acknowledged: true })
  } catch (e) {
    return serverErrorResponse(e)
  }
}
