import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const CreateCustomerSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  membership_status: z.enum(['none', 'active', 'expired', 'cancelled']).optional(),
  notes: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  try {
    await requirePermission('customers.view')
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const membership = searchParams.get('membership')
    const page = Number.parseInt(searchParams.get('page') ?? '1', 10)
    const limit = Number.parseInt(searchParams.get('limit') ?? '50', 10)
    const offset = (page - 1) * limit

    let query = supabase
      .from('customers')
      .select('*, vehicles(count)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    if (membership) {
      query = query.eq('membership_status', membership)
    }

    const { data, error, count } = await query
    if (error) return errorResponse(error.message)

    return successResponse({
      customers: data ?? [],
      total: count ?? 0,
      page,
      limit,
    })
  } catch (error) {
    return serverErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission('customers.create')
    const parsed = await parseBody(request, CreateCustomerSchema)
    if ('error' in parsed) return parsed.error

    const supabase = await createClient()
    const { data, error } = await supabase.from('customers').insert(parsed.data).select().single()

    if (error) {
      if (error.code === '23505') {
        return errorResponse('A customer with this email already exists')
      }
      return errorResponse(error.message)
    }

    return successResponse(data, 201)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
