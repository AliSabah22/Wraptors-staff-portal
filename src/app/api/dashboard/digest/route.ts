import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, serverErrorResponse } from '@/lib/api/helpers'

export const dynamic = 'force-dynamic'

/** Calendar date string YYYY-MM-DD in UTC (matches Postgres DATE comparison). */
function utcTodayString(): string {
  const n = new Date()
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, '0')}-${String(n.getUTCDate()).padStart(2, '0')}`
}

const NON_TERMINAL = '(completed,cancelled)'

export async function GET() {
  try {
    await requirePermission('jobs.view_operational')
    const supabase = await createClient()
    const today = utcTodayString()
    const day24hAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const expireBefore = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const [dueToday, overdue, inProgress, readyPickup, newQuotes24h, invRes, warrantyRes] = await Promise.all([
        supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('end_date', today)
          .not('status', 'in', NON_TERMINAL),
        supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .lt('end_date', today)
          .not('end_date', 'is', null)
          .not('status', 'in', NON_TERMINAL),
        supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .in('status', ['intake', 'in_progress', 'quality_check']),
        supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ready_for_pickup'),
        supabase
          .from('quote_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'new')
          .gte('created_at', day24hAgo),
        supabase.from('invoices').select('id, total, status, due_date').in('status', ['sent', 'overdue']),
        supabase
          .from('job_warranties')
          .select('*', { count: 'exact', head: true })
          .gte('expires_at', today)
          .lte('expires_at', expireBefore),
      ])

    const warrantyCount =
      typeof warrantyRes.count === 'number' ? warrantyRes.count : 0

    const invRows = invRes.data ?? []
    const outstandingTotal = invRows.reduce((s, r) => s + Number(r.total ?? 0), 0)
    const overdue30 = invRows.filter((r) => {
      if (r.status !== 'sent' || !r.due_date) return false
      const due = new Date(r.due_date + 'T12:00:00.000Z').getTime()
      return due < Date.now() - 30 * 24 * 60 * 60 * 1000
    }).length

    return successResponse({
      jobs_due_today: dueToday.count ?? 0,
      jobs_overdue: overdue.count ?? 0,
      jobs_in_progress: inProgress.count ?? 0,
      jobs_ready_for_pickup: readyPickup.count ?? 0,
      new_quote_requests_24h: newQuotes24h.count ?? 0,
      outstanding_invoice_count: invRows.length,
      outstanding_invoice_total: outstandingTotal,
      invoices_overdue_30d: overdue30,
      warranties_expiring_soon: warrantyCount,
      today_utc: today,
    })
  } catch (error) {
    return serverErrorResponse(error)
  }
}
