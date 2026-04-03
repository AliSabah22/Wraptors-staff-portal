import type { Service } from '@/types'
import { createClient } from '@/lib/supabase/server'

export async function getServices(): Promise<Service[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return []
    return (data as unknown as Service[]) ?? []
  } catch {
    return []
  }
}
