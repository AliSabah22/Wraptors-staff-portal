import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'

const CreateMessageSchema = z.object({
  thread_id: z.string().uuid(),
  body: z.string().min(1),
})

const CreateThreadSchema = z.object({
  type: z.enum(['job', 'direct', 'general']),
  job_id: z.string().uuid().optional().nullable(),
  title: z.string().optional().nullable(),
  initial_message: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  try {
    await requireAuth()
    await requirePermission('chat.view')
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    let query = supabase
      .from('chat_threads')
      .select(`
        *,
        chat_messages(
          id, body, created_at, read_by,
          staff_users!sender_id(id, full_name, avatar_url, role)
        ),
        jobs(id, status, customers(full_name), vehicles(make, model))
      `)
      .order('created_at', { ascending: false })

    if (jobId) query = query.eq('job_id', jobId)

    const { data, error } = await query
    if (error) return errorResponse(error.message)
    return successResponse(data ?? [])
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    await requirePermission('chat.send')
    const body = await request.json()
    const supabase = await createClient()

    if (body.type) {
      const parsed = CreateThreadSchema.safeParse(body)
      if (!parsed.success) return errorResponse('Invalid thread data')
      const { data: thread, error: threadError } = await supabase
        .from('chat_threads')
        .insert({ ...parsed.data, created_by: user.id })
        .select()
        .single()
      if (threadError) return errorResponse(threadError.message)
      return successResponse(thread, 201)
    }

    const parsed = CreateMessageSchema.safeParse(body)
    if (!parsed.success) return errorResponse('Invalid message data')
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ ...parsed.data, sender_id: user.id })
      .select('*, staff_users!sender_id(id, full_name, avatar_url)')
      .single()
    if (error) return errorResponse(error.message)
    return successResponse(data, 201)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
