import type { Vehicle } from '@/types'
import { createClient } from '@/lib/supabase/server'

export async function getVehicles(): Promise<Vehicle[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return []
    return (data as unknown as Vehicle[]) ?? []
  } catch {
    return []
  }
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).single()
    if (error || !data) return null
    return data as unknown as Vehicle
  } catch {
    return null
  }
}
