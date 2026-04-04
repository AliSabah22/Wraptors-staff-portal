import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/auth/helpers'
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
  errorResponse,
} from '@/lib/api/helpers'
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

    const { data: existing, error: fetchErr } = await supabase
      .from('jobs')
      .select('status')
      .eq('id', p.id)
      .maybeSingle()

    if (fetchErr || !existing) return notFoundResponse('Job')

    const prevStatus = String((existing as { status?: string }).status ?? '')
    const nextStatus = parsed.data.status

    if (nextStatus === 'completed' && prevStatus !== 'completed') {
      const { data: mediaRows, error: mediaErr } = await supabase
        .from('job_media')
        .select('type')
        .eq('job_id', p.id)

      if (mediaErr) return errorResponse(mediaErr.message, 500)

      const rows = (mediaRows ?? []) as { type: string }[]
      const beforeCount = rows.filter((r) => r.type === 'before').length
      const afterCount = rows.filter((r) => r.type === 'after').length
      if (beforeCount < 1 || afterCount < 1) {
        return errorResponse(
          'Marking completed requires at least one before photo and one after photo in job media.',
          422
        )
      }
    }

    const { data, error } = await supabase
      .from('jobs')
      .update(parsed.data)
      .eq('id', p.id)
      .select('*, customers(full_name), vehicles(make, model, year)')
      .single()

    if (error || !data) return notFoundResponse('Job')

    const row = data as Record<string, unknown>
    const newStatus = String(row.status ?? '')
    if (newStatus === 'completed' && prevStatus !== 'completed') {
      const customerId = row.customer_id != null ? String(row.customer_id) : ''
      const jobId = p.id
      if (customerId) {
        try {
          const admin = createAdminClient()
          const reviewUrl = process.env.GOOGLE_REVIEW_URL?.trim() || null

          const { error: appNErr } = await admin.from('app_notifications').insert({
            customer_id: customerId,
            type: 'review_request',
            title: 'How was your experience?',
            message:
              'Your vehicle work is complete. If you have a moment, we would love your feedback.',
            data: { review_url: reviewUrl, job_id: jobId },
            job_id: jobId,
          })
          if (appNErr) console.error('[jobs PUT] app_notifications insert', appNErr)

          const { data: ceos, error: ceoErr } = await admin
            .from('staff_users')
            .select('id')
            .eq('role', 'ceo')
            .eq('is_active', true)

          if (ceoErr) {
            console.error('[jobs PUT] staff_users ceo list', ceoErr)
          } else {
            for (const c of ceos ?? []) {
              const uid = (c as { id: string }).id
              const { error: nErr } = await admin.from('notifications').insert({
                user_id: uid,
                type: 'job_completed',
                title: 'Job completed',
                message:
                  'A job was marked complete and a review request was queued for the customer app.',
                link: `/jobs/${jobId}`,
              })
              if (nErr) console.error('[jobs PUT] notifications insert', nErr)
            }
          }
        } catch (e) {
          console.error('[jobs PUT] post-complete notifications', e)
        }
      }
    }

    if (newStatus === 'ready_for_pickup' && prevStatus !== 'ready_for_pickup') {
      const customerId = row.customer_id != null ? String(row.customer_id) : ''
      const jobId = p.id
      if (customerId) {
        try {
          const admin = createAdminClient()
          const veh = row.vehicles as { make?: string; model?: string; year?: number } | null
          const vehLabel = veh
            ? `${veh.year ?? ''} ${veh.make ?? ''} ${veh.model ?? ''}`.trim()
            : 'Your vehicle'
          const { error: pickupNErr } = await admin.from('app_notifications').insert({
            customer_id: customerId,
            type: 'pickup_ready',
            title: 'Ready for pickup',
            message: `${vehLabel} is ready. Please schedule your pickup with the shop.`,
            data: { job_id: jobId },
            job_id: jobId,
          })
          if (pickupNErr) console.error('[jobs PUT] pickup_ready app_notifications', pickupNErr)
        } catch (e) {
          console.error('[jobs PUT] pickup_ready notification', e)
        }
      }
    }

    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
