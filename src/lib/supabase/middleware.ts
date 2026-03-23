// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do not remove this line
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let hasStaffProfile = false

  if (user) {
    const { data: staffProfile, error: staffProfileError } = await supabase
      .from('staff_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    // If profile check fails (RLS/temporary DB issue), do not hard-lock a valid
    // authenticated user into a login loop. Only mark false when query succeeds
    // and returns no row.
    if (staffProfileError) {
      hasStaffProfile = true
    } else {
      hasStaffProfile = !!staffProfile
    }
  }

  return { supabaseResponse, user, hasStaffProfile }
}
