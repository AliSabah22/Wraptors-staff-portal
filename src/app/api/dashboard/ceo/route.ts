import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, serverErrorResponse } from '@/lib/api/helpers'
import type { CeoDashboardPayload } from '@/types/ceo-dashboard'

export const dynamic = 'force-dynamic'

const TERMINAL = '(completed,cancelled)'
const ACTIVE_STATUSES = ['intake', 'in_progress', 'quality_check', 'ready_for_pickup'] as const

function utcTodayString(): string {
  const n = new Date()
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, '0')}-${String(n.getUTCDate()).padStart(2, '0')}`
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
}

function addUtcDays(d: Date, days: number): Date {
  const x = new Date(d.getTime())
  x.setUTCDate(x.getUTCDate() + days)
  return x
}

function toIso(d: Date): string {
  return d.toISOString()
}

function sumPaidInRange(
  rows: { total: number | null; paid_at: string | null }[] | null,
  startMs: number,
  endMs: number
): number {
  let s = 0
  for (const r of rows ?? []) {
    if (!r.paid_at) continue
    const t = new Date(r.paid_at).getTime()
    if (t >= startMs && t < endMs) s += Number(r.total ?? 0)
  }
  return s
}

function utcDayStringFromDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function parseDayBoundsUtc(fromDay: string, toDay: string): { startIso: string; endIso: string } {
  const [fy, fm, fd] = fromDay.split('-').map(Number)
  const [ty, tm, td] = toDay.split('-').map(Number)
  const startIso = new Date(Date.UTC(fy, fm - 1, fd, 0, 0, 0, 0)).toISOString()
  const endIso = new Date(Date.UTC(ty, tm - 1, td, 23, 59, 59, 999)).toISOString()
  return { startIso, endIso }
}

type JobRowLight = {
  id: string
  status: string
  end_date: string | null
  created_at: string
  price: number | null
  services: string[] | null
}

function mergeJobsById(a: JobRowLight[], b: JobRowLight[]): JobRowLight[] {
  const m = new Map<string, JobRowLight>()
  for (const j of a) m.set(j.id, j)
  for (const j of b) m.set(j.id, j)
  return [...m.values()]
}

export async function GET(request: Request) {
  try {
    await requirePermission('dashboard.view_full')
    const sp = new URL(request.url).searchParams
    const period = sp.get('period') === 'month' ? 'month' : 'week'
    const supabase = await createClient()
    const now = new Date()
    const today = utcTodayString()
    const todayStart = startOfUtcDay(now)
    const yesterdayStart = addUtcDays(todayStart, -1)
    const weekCurrentStart = addUtcDays(todayStart, -6)
    const weekPrevStart = addUtcDays(todayStart, -13)
    const weekPrevEnd = weekCurrentStart
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
    const expireBefore = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const paidFetchStart = addUtcDays(monthStart, -62)

    const defaultFromDay = utcDayStringFromDate(addUtcDays(todayStart, -29))
    const from_day = sp.get('from_day')?.trim() || defaultFromDay
    const to_day = sp.get('to_day')?.trim() || today
    const { startIso: periodStartIso, endIso: periodEndIso } = parseDayBoundsUtc(from_day, to_day)

    const techPeriodStart = new Date(now)
    if (period === 'week') {
      techPeriodStart.setUTCDate(techPeriodStart.getUTCDate() - 7)
    } else {
      techPeriodStart.setUTCMonth(techPeriodStart.getUTCMonth() - 1)
    }
    const techStartIso = techPeriodStart.toISOString()

    const [
      dueTodayRes,
      overdueRes,
      activeRes,
      readyRes,
      newQuotesCountRes,
      newQuotesRowsRes,
      invRes,
      paidRowsRes,
      warrantyRes,
      jobsByEndDateRes,
      jobsByCreatedRes,
      quotesInPeriodRes,
      newCustomersPeriodRes,
      paidInvoicesPeriodRes,
      techsRes,
      completedForTechRes,
      reviewsRes,
      liveJobsRes,
      readyIdsRes,
    ] = await Promise.all([
      supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('end_date', today)
        .not('status', 'in', TERMINAL),
      supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .lt('end_date', today)
        .not('end_date', 'is', null)
        .not('status', 'in', TERMINAL),
      supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .in('status', [...ACTIVE_STATUSES]),
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'ready_for_pickup'),
      supabase.from('quote_requests').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      supabase
        .from('quote_requests')
        .select('id, customer_name, services_requested, created_at')
        .eq('status', 'new')
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('invoices')
        .select(
          `
          id, total, status, due_date, created_at,
          customers(full_name)
        `
        )
        .in('status', ['sent', 'overdue']),
      supabase
        .from('invoices')
        .select('total, paid_at')
        .eq('status', 'paid')
        .gte('paid_at', toIso(paidFetchStart)),
      supabase
        .from('job_warranties')
        .select('*', { count: 'exact', head: true })
        .gte('expires_at', today)
        .lte('expires_at', expireBefore),
      supabase
        .from('jobs')
        .select('id, status, end_date, created_at, price, services')
        .gte('end_date', from_day)
        .lte('end_date', to_day),
      supabase
        .from('jobs')
        .select('id, status, end_date, created_at, price, services')
        .gte('created_at', periodStartIso)
        .lte('created_at', periodEndIso),
      supabase
        .from('quote_requests')
        .select('id, status, created_at')
        .gte('created_at', periodStartIso)
        .lte('created_at', periodEndIso),
      supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', periodStartIso)
        .lte('created_at', periodEndIso),
      supabase
        .from('invoices')
        .select('total, paid_at')
        .eq('status', 'paid')
        .gte('paid_at', periodStartIso)
        .lte('paid_at', periodEndIso),
      supabase.from('staff_users').select('id, full_name, role').eq('role', 'technician').eq('is_active', true),
      supabase
        .from('jobs')
        .select('id, technician_id, price, status, updated_at')
        .eq('status', 'completed')
        .gte('updated_at', techStartIso),
      supabase.from('reviews').select('job_id, rating'),
      supabase
        .from('jobs')
        .select(
          `
        *,
        customers(id, full_name, phone),
        vehicles(id, make, model, year, color),
        staff_users!technician_id(id, full_name, role),
        job_media(id, type)
      `
        )
        .not('status', 'in', TERMINAL)
        .order('updated_at', { ascending: false })
        .limit(80),
      supabase.from('jobs').select('id').eq('status', 'ready_for_pickup'),
    ])

    const paidRows = (paidRowsRes.data ?? []) as { total: number | null; paid_at: string | null }[]
    const t0 = todayStart.getTime()
    const revenue_today = sumPaidInRange(paidRows, t0, Number.POSITIVE_INFINITY)
    const revenue_yesterday = sumPaidInRange(paidRows, yesterdayStart.getTime(), t0)
    const revenue_this_week = sumPaidInRange(paidRows, weekCurrentStart.getTime(), Number.POSITIVE_INFINITY)
    const revenue_prev_week = sumPaidInRange(paidRows, weekPrevStart.getTime(), weekPrevEnd.getTime())
    const week_vs_prev_week_percent =
      revenue_prev_week > 0
        ? Math.round(((revenue_this_week - revenue_prev_week) / revenue_prev_week) * 100)
        : revenue_this_week > 0
          ? 100
          : null

    const invRows = (invRes.data ?? []) as {
      id: string
      total: number | null
      status: string
      due_date: string | null
      created_at: string | null
      customers: { full_name: string | null } | null
    }[]
    const outstanding_invoice_total = invRows.reduce((s, r) => s + Number(r.total ?? 0), 0)
    const outstanding_invoice_count = invRows.length
    const sortedInv = [...invRows].sort((a, b) => {
      const ad = a.due_date ? new Date(a.due_date + 'T12:00:00.000Z').getTime() : 0
      const bd = b.due_date ? new Date(b.due_date + 'T12:00:00.000Z').getTime() : 0
      return ad - bd
    })
    const outstanding_invoices = sortedInv.slice(0, 3).map((r) => ({
      id: r.id,
      total: Number(r.total ?? 0),
      status: r.status,
      due_date: r.due_date,
      created_at: r.created_at,
      customer_name: r.customers?.full_name ?? null,
    }))

    const jobsMerged = mergeJobsById(
      (jobsByEndDateRes.data ?? []) as JobRowLight[],
      (jobsByCreatedRes.data ?? []) as JobRowLight[]
    )

    const terminal = new Set(['completed', 'cancelled'])
    const activeInPeriod = jobsMerged.filter((j) =>
      (ACTIVE_STATUSES as readonly string[]).includes(j.status)
    ).length
    const jobsDueInPeriod = jobsMerged.filter(
      (j) =>
        j.end_date != null &&
        j.end_date >= from_day &&
        j.end_date <= to_day &&
        !terminal.has(j.status)
    ).length

    const quoteRows = (quotesInPeriodRes.data ?? []) as { id: string; status: string }[]
    const pendingQuotesInPeriod = quoteRows.filter((q) => q.status === 'new' || q.status === 'contacted').length
    const quotesSentInPeriod = quoteRows.filter((q) => q.status === 'quoted').length
    const conversionRate =
      quoteRows.length > 0
        ? Math.round(
            (quoteRows.filter((q) =>
              ['quoted', 'accepted', 'converted'].includes(q.status)
            ).length /
              quoteRows.length) *
              100
          )
        : 0

    const paidPeriodRows = (paidInvoicesPeriodRes.data ?? []) as { total: number | null }[]
    const paid_revenue = paidPeriodRows.reduce((s, r) => s + Number(r.total ?? 0), 0)

    const completedInPeriod = jobsMerged.filter((j) => j.status === 'completed')
    let completedRevenueSum = 0
    const serviceTotals: Record<string, number> = {}
    for (const job of completedInPeriod) {
      const price = Number(job.price ?? 0)
      completedRevenueSum += price
      const svcs = Array.isArray(job.services) && job.services.length > 0 ? job.services : ['Other']
      const share = price / svcs.length
      for (const raw of svcs) {
        const key = raw.length > 24 ? `${raw.slice(0, 21)}…` : raw
        serviceTotals[key] = (serviceTotals[key] ?? 0) + share
      }
    }
    const revenue_by_service_period = Object.entries(serviceTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }))

    const jobs_completed = completedInPeriod.length
    const avg_job_value = jobs_completed > 0 ? completedRevenueSum / jobs_completed : 0

    const inProg = jobsMerged.filter((j) => j.status === 'in_progress' || j.status === 'quality_check').length
    const intakeC = jobsMerged.filter((j) => j.status === 'intake').length
    const readyC = jobsMerged.filter((j) => j.status === 'ready_for_pickup').length
    const completedC = jobsMerged.filter((j) => j.status === 'completed').length
    const job_status_pie: { name: string; value: number; color: string }[] = []
    if (inProg > 0) job_status_pie.push({ name: 'In Progress', value: inProg, color: '#C8A45D' })
    if (intakeC > 0) job_status_pie.push({ name: 'Intake', value: intakeC, color: '#737373' })
    if (readyC > 0) job_status_pie.push({ name: 'Ready', value: readyC, color: '#22c55e' })
    if (completedC > 0) job_status_pie.push({ name: 'Completed', value: completedC, color: '#3b82f6' })

    const selected_period = {
      from_day,
      to_day,
      paid_revenue,
      revenue_by_service: revenue_by_service_period,
      summary: {
        active_in_shop: activeInPeriod,
        jobs_due_in_period: jobsDueInPeriod,
        pending_quotes: pendingQuotesInPeriod,
        jobs_completed,
        quotes_sent: quotesSentInPeriod,
        new_customers: newCustomersPeriodRes.count ?? 0,
        avg_job_value,
        conversion_rate: conversionRate,
      },
      job_status_pie,
    }

    const readyIds = ((readyIdsRes.data ?? []) as { id: string }[]).map((r) => r.id)
    let ready_pickup_all_notified = true
    if (readyIds.length > 0) {
      const { data: pickupNotes } = await supabase
        .from('app_notifications')
        .select('job_id')
        .eq('type', 'pickup_ready')
        .in('job_id', readyIds)
      const notified = new Set((pickupNotes ?? []).map((n) => String((n as { job_id: string }).job_id)))
      ready_pickup_all_notified = readyIds.every((id) => notified.has(id))
    }

    const techs = (techsRes.data ?? []) as { id: string; full_name?: string }[]
    const completedForTech = (completedForTechRes.data ?? []) as {
      id: string
      technician_id: string | null
      price: number | null
    }[]
    const reviews = (reviewsRes.data ?? []) as { job_id: string; rating: number }[]
    const ratingByJob = new Map<string, number>()
    for (const r of reviews) {
      ratingByJob.set(r.job_id, r.rating)
    }

    const technicianRows = techs.map((t) => {
      const id = t.id
      const name = String(t.full_name ?? 'Technician')
      const mine = completedForTech.filter((j) => j.technician_id === id)
      const revenue = mine.reduce((s, j) => s + Number(j.price ?? 0), 0)
      const ratings: number[] = []
      for (const j of mine) {
        const rt = ratingByJob.get(j.id)
        if (rt != null) ratings.push(rt)
      }
      const avgRating =
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null
      return {
        id,
        name,
        completed_jobs: mine.length,
        revenue,
        avg_rating: avgRating,
      }
    })
    technicianRows.sort((a, b) => b.completed_jobs - a.completed_jobs)

    const newQuotesList = (newQuotesRowsRes.data ?? []) as {
      id: string
      customer_name: string
      services_requested: string[] | null
      created_at: string
    }[]
    const newQuotesCount = newQuotesCountRes.count ?? 0

    const payload: CeoDashboardPayload = {
      tiles: {
        revenue_today: revenue_today,
        revenue_yesterday: revenue_yesterday,
        revenue_this_week: revenue_this_week,
        revenue_prev_week: revenue_prev_week,
        week_vs_prev_week_percent,
        active_jobs: activeRes.count ?? 0,
        jobs_due_today: dueTodayRes.count ?? 0,
        jobs_overdue: overdueRes.count ?? 0,
        quote_requests_new: newQuotesCount,
        ready_for_pickup: readyRes.count ?? 0,
        ready_pickup_all_notified,
        outstanding_invoice_total,
        outstanding_invoice_count,
        warranties_expiring_30d: warrantyRes.count ?? 0,
      },
      new_quotes: newQuotesList,
      new_quotes_more: Math.max(0, newQuotesCount - newQuotesList.length),
      outstanding_invoices,
      selected_period,
      technicians: {
        period,
        technicians: technicianRows.slice(0, 5),
      },
      live_jobs: liveJobsRes.data ?? [],
    }

    if (liveJobsRes.error) {
      return serverErrorResponse(new Error(liveJobsRes.error.message))
    }

    return successResponse(payload)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
