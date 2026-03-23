import type { Vehicle } from '@/types'
import { createClient } from '@/lib/supabase/server'
import { mockVehicles } from '@/data/mock'

export async function getVehicles(): Promise<Vehicle[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return mockVehicles
    }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return mockVehicles
    return (data as unknown as Vehicle[]) ?? []
  } catch {
    return mockVehicles
  }
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return mockVehicles.find((v) => v.id === id) ?? null
    }
    const supabase = await createClient()
    const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).single()
    if (error || !data) return null
    return data as unknown as Vehicle
  } catch {
    return mockVehicles.find((v) => v.id === id) ?? null
  }
}
