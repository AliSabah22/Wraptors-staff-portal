import type { ServiceJob } from '@/types'
import { createClient } from '@/lib/supabase/server'

export async function getJobs(): Promise<ServiceJob[]> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return []
    return (data as unknown as ServiceJob[]) ?? []
  } catch {
    return []
  }
}

export async function getJobById(id: string): Promise<ServiceJob | null> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single()
    if (error || !data) return null
    return data as unknown as ServiceJob
  } catch {
    return null
  }
}

export async function getJobsByCustomer(customerId: string): Promise<ServiceJob[]> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    if (error) return []
    return (data as unknown as ServiceJob[]) ?? []
  } catch {
    return []
  }
}

export async function updateJobStatus(id: string, status: ServiceJob['status']): Promise<ServiceJob | null> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('jobs')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single()
    if (error || !data) return null
    return data as unknown as ServiceJob
  } catch {
    return null
  }
}
