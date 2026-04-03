import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { errorResponse, serverErrorResponse } from '@/lib/api/helpers'
import { customersToCsvString, type CustomerExportRow } from '@/lib/customers/csv'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 500

export async function GET(request: Request) {
  try {
    await requirePermission('customers.create')
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const membership = searchParams.get('membership')

    const allRows: CustomerExportRow[] = []
    let offset = 0

    for (;;) {
      let query = supabase
        .from('customers')
        .select('full_name, email, phone, membership_status, notes, source')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
        )
      }
      if (membership) {
        query = query.eq('membership_status', membership)
      }

      const { data, error } = await query
      if (error) return errorResponse(error.message)

      const chunk = (data ?? []) as CustomerExportRow[]
      allRows.push(...chunk)
      if (chunk.length < PAGE_SIZE) break
      offset += PAGE_SIZE
    }

    const csv = customersToCsvString(allRows)
    const filename = `customers-${new Date().toISOString().slice(0, 10)}.csv`
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return serverErrorResponse(error)
  }
}
