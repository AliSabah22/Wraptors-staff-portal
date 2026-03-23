import type { NotificationItem } from '@/types'
import { createClient } from '@/lib/supabase/server'
import { mockNotifications } from '@/data/mock'

export async function getNotifications(userId?: string): Promise<NotificationItem[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return userId ? mockNotifications.filter((n) => n.userId === userId) : mockNotifications
    }
    const supabase = await createClient()
    const query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    const { data, error } = userId ? await query.eq('user_id', userId) : await query
    if (error) return userId ? mockNotifications.filter((n) => n.userId === userId) : mockNotifications
    return (data as unknown as NotificationItem[]) ?? []
  } catch {
    return userId ? mockNotifications.filter((n) => n.userId === userId) : mockNotifications
  }
}
