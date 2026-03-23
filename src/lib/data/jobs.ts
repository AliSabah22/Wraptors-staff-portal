import type { ServiceJob } from '@/types'
import { createClient } from '@/lib/supabase/server'
import { mockJobs } from '@/data/mock'

export async function getJobs(): Promise<ServiceJob[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return mockJobs
    }
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return mockJobs
    return (data as unknown as ServiceJob[]) ?? []
  } catch {
    return mockJobs
  }
}

export async function getJobById(id: string): Promise<ServiceJob | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return mockJobs.find((j) => j.id === id) ?? null
    }
    const supabase = (await createClient()) as any
    const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single()
    if (error || !data) return null
    return data as unknown as ServiceJob
  } catch {
    return mockJobs.find((j) => j.id === id) ?? null
  }
}
