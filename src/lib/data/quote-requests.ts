import { createClient } from '@/lib/supabase/server'

type QuoteRequestRow = Record<string, unknown>

export async function getQuoteRequests(): Promise<QuoteRequestRow[]> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return []
    return (data ?? []) as QuoteRequestRow[]
  } catch {
    return []
  }
}

export async function getQuoteRequestById(id: string): Promise<QuoteRequestRow | null> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data as QuoteRequestRow
  } catch {
    return null
  }
}
