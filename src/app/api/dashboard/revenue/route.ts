import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, serverErrorResponse } from '@/lib/api/helpers'

export const dynamic = 'force-dynamic'

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

function dayKeyUtc(iso: string): string {
  return iso.slice(0, 10)
}

export async function GET() {
  try {
    await requirePermission('invoices.view')
    const supabase = await createClient()
    const now = new Date()
    const todayStart = startOfUtcDay(now)
    const weekStart = addUtcDays(todayStart, -6)
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
    const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0))
    const lastMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999))

    const [todayRows, weekRows, monthRows, lastMonthRows, last7] = await Promise.all([
      supabase
        .from('invoices')
        .select('total')
        .eq('status', 'paid')
        .gte('paid_at', toIso(todayStart)),
      supabase
        .from('invoices')
        .select('total')
        .eq('status', 'paid')
        .gte('paid_at', toIso(weekStart)),
      supabase
        .from('invoices')
        .select('total')
        .eq('status', 'paid')
        .gte('paid_at', toIso(monthStart)),
      supabase
        .from('invoices')
        .select('total')
        .eq('status', 'paid')
        .gte('paid_at', toIso(lastMonthStart))
        .lte('paid_at', toIso(lastMonthEnd)),
      supabase
        .from('invoices')
        .select('total, paid_at')
        .eq('status', 'paid')
        .gte('paid_at', toIso(addUtcDays(todayStart, -6))),
    ])

    const sum = (rows: { total: number | null }[] | null) =>
      (rows ?? []).reduce((s, r) => s + Number(r.total ?? 0), 0)

    const today = sum(todayRows.data)
    const thisWeek = sum(weekRows.data)
    const thisMonth = sum(monthRows.data)
    const lastMonth = sum(lastMonthRows.data)

    const monthVsLast =
      lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null

    const byDay = new Map<string, number>()
    for (let i = 0; i < 7; i++) {
      const k = dayKeyUtc(toIso(addUtcDays(todayStart, -i)))
      byDay.set(k, 0)
    }
    for (const row of last7.data ?? []) {
      if (!row.paid_at) continue
      const k = dayKeyUtc(row.paid_at)
      if (byDay.has(k)) {
        byDay.set(k, (byDay.get(k) ?? 0) + Number(row.total ?? 0))
      }
    }

    const last7days = Array.from({ length: 7 }, (_, i) => {
      const d = addUtcDays(todayStart, -6 + i)
      const k = dayKeyUtc(toIso(d))
      return {
        date: k,
        label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
        revenue: byDay.get(k) ?? 0,
      }
    })

    return successResponse({
      today,
      this_week: thisWeek,
      this_month: thisMonth,
      last_month: lastMonth,
      month_vs_last_percent: monthVsLast,
      last_7_days: last7days,
    })
  } catch (error) {
    return serverErrorResponse(error)
  }
}
