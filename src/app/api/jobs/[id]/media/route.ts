import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const dataOrHttpUrl = z.string().refine(
  (s) => {
    try {
      const u = new URL(s)
      return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'data:'
    } catch {
      return false
    }
  },
  { message: 'Must be a valid http(s) or data URL' }
)

const AddMediaSchema = z.object({
  url: dataOrHttpUrl,
  storage_path: z.string().optional(),
  type: z.enum(['before', 'after', 'progress']),
  caption: z.string().optional().nullable(),
})

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    await requirePermission('media.view')
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('job_media')
      .select('*')
      .eq('job_id', p.id)
      .order('created_at', { ascending: true })

    if (error) return errorResponse(error.message)
    return successResponse(data ?? [])
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    const user = await requirePermission('media.upload')
    const parsed = await parseBody(request, AddMediaSchema)
    if ('error' in parsed) return parsed.error

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('job_media')
      .insert({ ...parsed.data, job_id: p.id, uploaded_by: user.id })
      .select()
      .single()

    if (error) return errorResponse(error.message)
    return successResponse(data, 201)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
