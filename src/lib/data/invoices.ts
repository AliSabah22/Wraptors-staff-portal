import { createClient } from '@/lib/supabase/server'

type InvoiceRow = Record<string, unknown>

export async function getInvoices(): Promise<InvoiceRow[]> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return []
    return (data ?? []) as InvoiceRow[]
  } catch {
    return []
  }
}
