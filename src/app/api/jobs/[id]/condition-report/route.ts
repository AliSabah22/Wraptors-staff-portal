import { randomBytes } from 'crypto'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'
import type { Json } from '@/types/database'

const PutSchema = z.object({
  zones: z.record(z.unknown()).optional(),
  photo_storage_paths: z.array(z.string()).optional(),
  regenerate_public_link: z.boolean().optional(),
})

const LINK_DAYS = 14

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requirePermission('jobs.view_operational')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vehicle_condition_reports')
      .select('*')
      .eq('job_id', id)
      .maybeSingle()

    if (error) return errorResponse(error.message)
    return successResponse({ report: data })
  } catch (e) {
    return serverErrorResponse(e)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requirePermission('jobs.edit_basic')
    const parsed = await parseBody(request, PutSchema)
    if ('error' in parsed) return parsed.error

    const supabase = await createClient()
    const { data: existing, error: exErr } = await supabase
      .from('vehicle_condition_reports')
      .select('id, acknowledgment_token')
      .eq('job_id', id)
      .maybeSingle()

    if (exErr) return errorResponse(exErr.message)

    const now = new Date().toISOString()
    const exp = new Date(Date.now() + LINK_DAYS * 86400000).toISOString()

    if (!existing) {
      const { data, error } = await supabase
        .from('vehicle_condition_reports')
        .insert({
          job_id: id,
          zones: (parsed.data.zones as Json) ?? {},
          photo_storage_paths: parsed.data.photo_storage_paths ?? [],
          acknowledgment_token: randomBytes(20).toString('base64url'),
          acknowledgment_token_expires_at: exp,
        })
        .select()
        .single()

      if (error) return errorResponse(error.message)
      return successResponse(data)
    }

    const ex = existing as { id: string; acknowledgment_token: string | null }
    const patch: Record<string, unknown> = {
      updated_at: now,
    }
    if (parsed.data.zones !== undefined) patch.zones = parsed.data.zones as Json
    if (parsed.data.photo_storage_paths !== undefined) patch.photo_storage_paths = parsed.data.photo_storage_paths
    if (parsed.data.regenerate_public_link || !ex.acknowledgment_token) {
      patch.acknowledgment_token = randomBytes(20).toString('base64url')
      patch.acknowledgment_token_expires_at = exp
    }

    const { data, error } = await supabase
      .from('vehicle_condition_reports')
      .update(patch)
      .eq('id', ex.id)
      .select()
      .single()

    if (error) return errorResponse(error.message)
    return successResponse(data)
  } catch (e) {
    return serverErrorResponse(e)
  }
}
