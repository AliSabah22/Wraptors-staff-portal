import type { Customer } from '@/types'
import { createClient } from '@/lib/supabase/server'
import { mockCustomers } from '@/data/mock'

export async function getCustomers(): Promise<Customer[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return mockCustomers
    }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return mockCustomers
    return (data as unknown as Customer[]) ?? []
  } catch {
    return mockCustomers
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return mockCustomers.find((c) => c.id === id) ?? null
    }
    const supabase = await createClient()
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single()
    if (error || !data) return null
    return data as unknown as Customer
  } catch {
    return mockCustomers.find((c) => c.id === id) ?? null
  }
}
