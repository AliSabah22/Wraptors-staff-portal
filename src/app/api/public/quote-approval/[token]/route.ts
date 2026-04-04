import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const PostSchema = z.object({
  action: z.enum(['approve', 'decline']),
  decline_reason: z.string().max(2000).optional().nullable(),
})

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    if (!token) return errorResponse('Missing token', 400)

    const admin = createAdminClient()
    const { data: row, error } = await admin
      .from('quote_requests')
      .select(
        'id, status, customer_name, estimated_value, services_requested, approval_token_expires_at, converted_job_id, vehicles(make, model, year)'
      )
      .eq('approval_token', token)
      .maybeSingle()

    if (error) return errorResponse(error.message)
    if (!row) return notFoundResponse('Quote')

    const r = row as Record<string, unknown>
    const quoteId = String(r.id ?? '')
    const exp = r.approval_token_expires_at != null ? String(r.approval_token_expires_at) : null
    if (exp && new Date(exp).getTime() < Date.now()) {
      return errorResponse('This approval link has expired.', 410)
    }

    const veh = r.vehicles as { make?: string; model?: string; year?: number } | null
    const vehicle_summary = veh
      ? [veh.year, veh.make, veh.model].filter(Boolean).join(' ')
      : null

    return successResponse({
      quote_id: quoteId,
      status: r.status,
      customer_name: r.customer_name,
      estimated_value: r.estimated_value,
      vehicle_summary,
      expires_at: exp,
    })
  } catch (e) {
    return serverErrorResponse(e)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    if (!token) return errorResponse('Missing token', 400)

    const parsed = await parseBody(request, PostSchema)
    if ('error' in parsed) return parsed.error

    const admin = createAdminClient()
    const { data: row, error: fetchErr } = await admin
      .from('quote_requests')
      .select('*')
      .eq('approval_token', token)
      .maybeSingle()

    if (fetchErr) return errorResponse(fetchErr.message)
    if (!row) return notFoundResponse('Quote')

    const r = row as Record<string, unknown>
    const quoteId = String(r.id ?? '')
    const exp = r.approval_token_expires_at != null ? String(r.approval_token_expires_at) : null
    if (exp && new Date(exp).getTime() < Date.now()) {
      return errorResponse('This approval link has expired.', 410)
    }

    const currentStatus = String(r.status ?? '')

    if (parsed.data.action === 'decline') {
      if (currentStatus === 'declined') {
        return successResponse({ status: 'declined', already: true })
      }
      if (currentStatus === 'accepted' || currentStatus === 'converted') {
        return errorResponse('Quote was already accepted.', 422)
      }
      const { error: upErr } = await admin
        .from('quote_requests')
        .update({
          status: 'declined',
          declined_at: new Date().toISOString(),
          decline_reason: parsed.data.decline_reason ?? null,
          approval_token: null,
          approval_token_expires_at: null,
        })
        .eq('id', quoteId)
      if (upErr) return errorResponse(upErr.message)
      return successResponse({ status: 'declined' })
    }

    // approve
    if (currentStatus === 'accepted' || currentStatus === 'converted') {
      return successResponse({
        status: currentStatus,
        job_id: r.converted_job_id ?? null,
        already: true,
      })
    }
    if (currentStatus === 'declined') {
      return errorResponse('Quote was declined.', 422)
    }

    const customerId = r.customer_id != null ? String(r.customer_id) : ''
    const vehicleId = r.vehicle_id != null ? String(r.vehicle_id) : ''
    const now = new Date().toISOString()

    let convertedJobId: string | null =
      r.converted_job_id != null ? String(r.converted_job_id) : null

    if (customerId && vehicleId) {
      const { data: job, error: jobErr } = await admin
        .from('jobs')
        .insert({
          customer_id: customerId,
          vehicle_id: vehicleId,
          quote_request_id: quoteId,
          services: (r.services_requested as string[]) ?? [],
          status: 'intake',
          price: r.estimated_value != null ? Number(r.estimated_value) : null,
          notes: r.notes != null ? String(r.notes) : null,
        })
        .select('id')
        .single()

      if (jobErr) return errorResponse(jobErr.message, 422)
      convertedJobId = String((job as { id: string }).id)

      const { error: upErr } = await admin
        .from('quote_requests')
        .update({
          status: 'converted',
          approved_at: now,
          converted_job_id: convertedJobId,
          approval_token: null,
          approval_token_expires_at: null,
        })
        .eq('id', quoteId)

      if (upErr) return errorResponse(upErr.message)
      return successResponse({ status: 'converted', job_id: convertedJobId })
    }

    const { error: upErr } = await admin
      .from('quote_requests')
      .update({
        status: 'accepted',
        approved_at: now,
        approval_token: null,
        approval_token_expires_at: null,
      })
      .eq('id', quoteId)

    if (upErr) return errorResponse(upErr.message)
    return successResponse({
      status: 'accepted',
      message:
        'Quote accepted. A shop team member will schedule the job once the vehicle is on file.',
    })
  } catch (e) {
    return serverErrorResponse(e)
  }
}
