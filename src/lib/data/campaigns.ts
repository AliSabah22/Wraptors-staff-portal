import { createClient } from '@/lib/supabase/server'

type CampaignRow = Record<string, unknown>

export async function getCampaigns(): Promise<CampaignRow[]> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return []
    return (data ?? []) as CampaignRow[]
  } catch {
    return []
  }
}

export async function getCampaignById(id: string): Promise<CampaignRow | null> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data as CampaignRow
  } catch {
    return null
  }
}
