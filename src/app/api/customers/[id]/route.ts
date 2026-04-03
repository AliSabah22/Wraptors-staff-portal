import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const UpdateCustomerSchema = z.object({
  full_name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  membership_status: z.enum(['none', 'active', 'expired', 'cancelled']).optional(),
  notes: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
})

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    await requirePermission('customers.view')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*, vehicles(*), jobs(id, status, created_at), memberships(*)')
      .eq('id', p.id)
      .single()

    if (error || !data) return notFoundResponse('Customer')
    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    await requirePermission('customers.edit')
    const parsed = await parseBody(request, UpdateCustomerSchema)
    if ('error' in parsed) return parsed.error

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('customers')
      .update(parsed.data)
      .eq('id', p.id)
      .select()
      .single()

    if (error || !data) return notFoundResponse('Customer')
    return successResponse(data)
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params
    await requirePermission('customers.delete')
    const supabase = await createClient()
    const { error } = await supabase.from('customers').delete().eq('id', p.id)
    if (error) return notFoundResponse('Customer')
    return successResponse({ deleted: true })
  } catch (error) {
    return serverErrorResponse(error)
  }
}
