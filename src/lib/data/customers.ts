import type { Customer } from '@/types'
import { createClient } from '@/lib/supabase/server'

export async function getCustomers(): Promise<Customer[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return []
    return (data as unknown as Customer[]) ?? []
  } catch {
    return []
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single()
    if (error || !data) return null
    return data as unknown as Customer
  } catch {
    return null
  }
}
