import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const PatchInvoiceSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  paid_at: z.string().datetime().optional().nullable(),
  due_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('invoices.manage')
    const { id } = await params
    const parsed = await parseBody(request, PatchInvoiceSchema)
    if ('error' in parsed) return parsed.error

    const supabase = await createClient()
    const { status, paid_at, due_date, notes } = parsed.data
    const patch: Record<string, unknown> = {}
    if (status !== undefined) patch.status = status
    if (paid_at !== undefined) patch.paid_at = paid_at
    if (due_date !== undefined) patch.due_date = due_date
    if (notes !== undefined) patch.notes = notes

    if (status === 'paid' && paid_at === undefined) {
      patch.paid_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('invoices')
      .update(patch)
      .eq('id', id)
      .select('*, customers(full_name, email)')
      .single()

    if (error) return errorResponse(error.message)
    if (!data) return notFoundResponse('Invoice')
    return successResponse(data)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
