import { createClient } from '@/lib/supabase/server'

type ShopSettingsRow = Record<string, unknown>

export async function getShopSettings(): Promise<ShopSettingsRow | null> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('shop_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
    if (error) return null
    return (data as ShopSettingsRow) ?? null
  } catch {
    return null
  }
}
