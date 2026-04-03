import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseAndValidateCustomerCsv } from '@/lib/customers/csv'
import { mapDbCustomerRowToCustomer } from '@/lib/server-data/hydration-mappers'
import type { Customer } from '@/types'

/** Max upload size for CSV imports. */
const MAX_CSV_BYTES = 2 * 1024 * 1024
/** Max data rows (excluding header) per request. */
const MAX_DATA_ROWS = 2000
const MAX_ERRORS_RETURNED = 50

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    await requirePermission('customers.create')

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return errorResponse('Missing file: expected multipart field "file"')
    }

    const type = file.type.toLowerCase()
    const name = file.name.toLowerCase()
    const typeOk =
      !type ||
      type.startsWith('text/csv') ||
      type === 'application/vnd.ms-excel' ||
      type === 'text/plain' ||
      type === 'application/csv'
    if (!typeOk && !name.endsWith('.csv')) {
      return errorResponse('File must be a CSV (.csv)')
    }

    if (file.size > MAX_CSV_BYTES) {
      return errorResponse(`File too large (max ${MAX_CSV_BYTES / (1024 * 1024)} MB)`)
    }

    const text = await file.text()
    if (!text.trim()) {
      return errorResponse('CSV file is empty')
    }

    const { meta, rows } = parseAndValidateCustomerCsv(text, MAX_DATA_ROWS)

    if (meta.rowCount > MAX_DATA_ROWS) {
      return errorResponse(`Too many rows (max ${MAX_DATA_ROWS} data rows)`)
    }

    if (meta.parseErrors.length && rows.length === 0) {
      return errorResponse(`Invalid CSV: ${meta.parseErrors.join('; ')}`)
    }

    const supabase = await createClient()
    let created = 0
    let skippedDuplicates = 0
    const errors: { row: number; message: string }[] = []
    const createdCustomers: Customer[] = []

    for (const row of rows) {
      if (!row.ok) {
        errors.push({ row: row.rowNumber, message: row.message })
        continue
      }

      const insert = {
        full_name: row.insert.full_name,
        email: row.insert.email,
        phone: row.insert.phone ?? null,
        membership_status: row.insert.membership_status ?? 'none',
        notes: row.insert.notes ?? null,
        source: row.insert.source ?? null,
      }

      const { data, error } = await supabase.from('customers').insert(insert).select().single()

      if (error) {
        if (error.code === '23505') {
          skippedDuplicates += 1
          errors.push({ row: row.rowNumber, message: 'email already exists' })
        } else {
          errors.push({ row: row.rowNumber, message: error.message })
        }
        continue
      }

      created += 1
      createdCustomers.push(mapDbCustomerRowToCustomer(data as Record<string, unknown>))
    }

    const payload = {
      created,
      skippedDuplicates,
      errors: errors.slice(0, MAX_ERRORS_RETURNED),
      errorsTruncated: errors.length > MAX_ERRORS_RETURNED,
      customers: createdCustomers,
    }

    return successResponse(payload, 201)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
