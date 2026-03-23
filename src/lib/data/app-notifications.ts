import { createClient } from '@/lib/supabase/server'

type AppNotificationRow = Record<string, unknown>

export async function getAppNotifications(customerId: string): Promise<AppNotificationRow[]> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('app_notifications')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    if (error) return []
    return (data ?? []) as AppNotificationRow[]
  } catch {
    return []
  }
}
