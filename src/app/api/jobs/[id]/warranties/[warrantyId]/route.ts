import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const PatchSchema = z.object({
  coverage_description: z.string().min(1).max(2000).optional(),
  expires_at: z.string().min(8).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; warrantyId: string }> }
) {
  try {
    const { id, warrantyId } = await params
    await requirePermission('jobs.edit_basic')
    const parsed = await parseBody(request, PatchSchema)
    if ('error' in parsed) return parsed.error

    const patch: Record<string, unknown> = {}
    if (parsed.data.coverage_description !== undefined) {
      patch.coverage_description = parsed.data.coverage_description
    }
    if (parsed.data.expires_at !== undefined) {
      patch.expires_at = parsed.data.expires_at.slice(0, 10)
    }
    patch.updated_at = new Date().toISOString()

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('job_warranties')
      .update(patch)
      .eq('id', warrantyId)
      .eq('job_id', id)
      .select()
      .single()

    if (error) return errorResponse(error.message)
    if (!data) return notFoundResponse('Warranty')
    return successResponse(data)
  } catch (e) {
    return serverErrorResponse(e)
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; warrantyId: string }> }
) {
  try {
    const { id, warrantyId } = await params
    await requirePermission('jobs.edit_basic')
    const supabase = await createClient()
    const { error } = await supabase
      .from('job_warranties')
      .delete()
      .eq('id', warrantyId)
      .eq('job_id', id)

    if (error) return errorResponse(error.message)
    return successResponse({ ok: true })
  } catch (e) {
    return serverErrorResponse(e)
  }
}
