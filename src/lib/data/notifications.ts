import type { NotificationItem } from '@/types'
import { createClient } from '@/lib/supabase/server'

export async function getNotifications(userId?: string): Promise<NotificationItem[]> {
  try {
    const supabase = await createClient()
    const query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    const { data, error } = userId ? await query.eq('user_id', userId) : await query
    if (error) return []
    return (data as unknown as NotificationItem[]) ?? []
  } catch {
    return []
  }
}
