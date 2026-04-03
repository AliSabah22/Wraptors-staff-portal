// lib/supabase/admin.ts
// Service role client — bypasses RLS
// ONLY use in server-side API routes that require admin operations
// NEVER expose this client to the browser
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url?.startsWith('http')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing or invalid.')
  }
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Staff invite and other admin routes need the service_role key from Supabase → Settings → API.'
    )
  }
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
