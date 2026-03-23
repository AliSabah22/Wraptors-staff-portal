import { createClient } from '@/lib/supabase/server'

type ReviewRow = Record<string, unknown>

export async function getReviewsByJob(jobId: string): Promise<ReviewRow[]> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
    if (error) return []
    return (data ?? []) as ReviewRow[]
  } catch {
    return []
  }
}
