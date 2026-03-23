import { createClient } from '@/lib/supabase/server'

type MembershipRow = Record<string, unknown>

export async function getMemberships(): Promise<MembershipRow[]> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) return []
    return (data ?? []) as MembershipRow[]
  } catch {
    return []
  }
}
