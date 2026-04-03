import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth/helpers'
import { serverErrorResponse } from '@/lib/api/helpers'
import { customerCsvTemplateString } from '@/lib/customers/csv'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requirePermission('customers.create')
    const body = customerCsvTemplateString()
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="customers-import-template.csv"',
      },
    })
  } catch (error) {
    return serverErrorResponse(error)
  }
}
