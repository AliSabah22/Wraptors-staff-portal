import { createClient } from '@/lib/supabase/server'

type JobMediaRow = Record<string, unknown>

export async function getJobMedia(jobId: string): Promise<JobMediaRow[]> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('job_media')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
    if (error) return []
    return (data ?? []) as JobMediaRow[]
  } catch {
    return []
  }
}
