import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const CreateInvoiceSchema = z.object({
  job_id: z.string().uuid(),
  due_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

function nextInvoiceNumber(year: number, existing: string[]): string {
  const prefix = `INV-${year}-`
  let max = 0
  for (const num of existing) {
    if (!num.startsWith(prefix)) continue
    const n = parseInt(num.slice(prefix.length), 10)
    if (!Number.isNaN(n) && n > max) max = n
  }
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

export async function GET(request: Request) {
  try {
    await requirePermission('invoices.view')
    const supabase = await createClient()
    const jobId = new URL(request.url).searchParams.get('job_id')

    let q = supabase
      .from('invoices')
      .select('*, customers(full_name, email)')
      .order('created_at', { ascending: false })

    if (jobId) {
      q = q.eq('job_id', jobId)
    }

    const { data, error } = await q

    if (error) return errorResponse(error.message)
    return successResponse({ invoices: data ?? [] })
  } catch (err) {
    return serverErrorResponse(err)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission('invoices.manage')
    const parsed = await parseBody(request, CreateInvoiceSchema)
    if ('error' in parsed) return parsed.error

    const supabase = await createClient()
    const { job_id, due_date, notes } = parsed.data

    const { data: existingInv } = await supabase
      .from('invoices')
      .select('id')
      .eq('job_id', job_id)
      .maybeSingle()

    if (existingInv) {
      return errorResponse('An invoice already exists for this job.', 409)
    }

    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, customer_id, status, price')
      .eq('id', job_id)
      .single()

    if (jobErr || !job) return errorResponse('Job not found', 404)

    if (String(job.status) !== 'completed') {
      return errorResponse('Invoices can only be created for completed jobs.', 422)
    }

    const { data: settingsRows, error: settingsErr } = await supabase
      .from('shop_settings')
      .select('tax_rate')
      .limit(1)

    if (settingsErr) return errorResponse(settingsErr.message)

    const taxRate = Number((settingsRows?.[0] as { tax_rate?: number } | undefined)?.tax_rate ?? 13)
    const subtotal = Math.round(Number(job.price ?? 0) * 100) / 100
    const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100
    const total = Math.round((subtotal + tax) * 100) / 100

    const year = new Date().getUTCFullYear()
    const { data: numberRows, error: numErr } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `INV-${year}-%`)

    if (numErr) return errorResponse(numErr.message)

    const numbers = ((numberRows ?? []) as { invoice_number: string }[]).map((r) => r.invoice_number)
    const invoice_number = nextInvoiceNumber(year, numbers)

    let due: string | null = due_date ?? null
    if (!due) {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() + 30)
      due = d.toISOString().slice(0, 10)
    }

    const { data: row, error: insErr } = await supabase
      .from('invoices')
      .insert({
        job_id,
        customer_id: String(job.customer_id),
        invoice_number,
        status: 'draft',
        subtotal,
        tax,
        total,
        due_date: due,
        notes: notes ?? null,
        created_by: user.id,
      })
      .select('*, customers(full_name, email)')
      .single()

    if (insErr) return errorResponse(insErr.message)
    return successResponse(row, 201)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
