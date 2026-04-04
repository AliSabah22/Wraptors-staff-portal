import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requirePermission('analytics.view_full')
    const period = new URL(request.url).searchParams.get('period') === 'month' ? 'month' : 'week'
    const now = new Date()
    const start = new Date(now)
    if (period === 'week') {
      start.setUTCDate(start.getUTCDate() - 7)
    } else {
      start.setUTCMonth(start.getUTCMonth() - 1)
    }
    const startIso = start.toISOString()

    const supabase = await createClient()

    const { data: techs, error: techErr } = await supabase
      .from('staff_users')
      .select('id, full_name, role')
      .eq('role', 'technician')
      .eq('is_active', true)

    if (techErr) return errorResponse(techErr.message)

    const { data: completedJobs, error: jobErr } = await supabase
      .from('jobs')
      .select('id, technician_id, price, status, updated_at')
      .eq('status', 'completed')
      .gte('updated_at', startIso)

    if (jobErr) return errorResponse(jobErr.message)

    const { data: reviews, error: revErr } = await supabase.from('reviews').select('job_id, rating')

    if (revErr) return errorResponse(revErr.message)

    const ratingByJob = new Map<string, number>()
    for (const r of reviews ?? []) {
      const row = r as { job_id: string; rating: number }
      ratingByJob.set(row.job_id, row.rating)
    }

    const jobs = (completedJobs ?? []) as {
      id: string
      technician_id: string | null
      price: number | null
    }[]

    const rows = (techs ?? []).map((t) => {
      const id = (t as { id: string }).id
      const name = String((t as { full_name?: string }).full_name ?? 'Technician')
      const mine = jobs.filter((j) => j.technician_id === id)
      const revenue = mine.reduce((s, j) => s + Number(j.price ?? 0), 0)
      const ratings: number[] = []
      for (const j of mine) {
        const rt = ratingByJob.get(j.id)
        if (rt != null) ratings.push(rt)
      }
      const avgRating =
        ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null
      return {
        id,
        name,
        completed_jobs: mine.length,
        revenue,
        avg_rating: avgRating,
      }
    })

    rows.sort((a, b) => b.completed_jobs - a.completed_jobs)

    return successResponse({ period, start: startIso, technicians: rows })
  } catch (e) {
    return serverErrorResponse(e)
  }
}
