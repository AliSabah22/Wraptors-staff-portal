import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const CreateSchema = z.object({
  coverage_description: z.string().min(1).max(2000),
  expires_at: z.string().min(8),
})

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requirePermission('jobs.view_operational')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('job_warranties')
      .select('*')
      .eq('job_id', id)
      .order('expires_at', { ascending: true })

    if (error) return errorResponse(error.message)
    return successResponse({ warranties: data ?? [] })
  } catch (e) {
    return serverErrorResponse(e)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requirePermission('jobs.edit_basic')
    const parsed = await parseBody(request, CreateSchema)
    if ('error' in parsed) return parsed.error

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('job_warranties')
      .insert({
        job_id: id,
        coverage_description: parsed.data.coverage_description,
        expires_at: parsed.data.expires_at.slice(0, 10),
      })
      .select()
      .single()

    if (error) return errorResponse(error.message)
    return successResponse(data, 201)
  } catch (e) {
    return serverErrorResponse(e)
  }
}
