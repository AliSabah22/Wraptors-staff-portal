import type { Service } from '@/types'
import { createClient } from '@/lib/supabase/server'
import { mockServices } from '@/data/mock'

export async function getServices(): Promise<Service[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return mockServices
    }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return mockServices
    return (data as unknown as Service[]) ?? []
  } catch {
    return mockServices
  }
}
