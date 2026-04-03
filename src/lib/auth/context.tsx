'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { StaffUserProfile } from '@/lib/auth/helpers'
import { normalizeRole } from '@/lib/auth/roles'

interface AuthContextType {
  user: User | null
  staffUser: StaffUserProfile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [staffUser, setStaffUser] = useState<StaffUserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const canUseSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http') &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  // Keep one browser client instance for the provider lifetime.
  const supabase = useMemo(() => (canUseSupabase ? createClient() : null), [canUseSupabase])

  const fetchStaffProfile = useCallback(
    async (userId: string) => {
      if (!supabase) return
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!res.ok) return
        const payload = (await res.json()) as {
          data: (Omit<StaffUserProfile, 'role'> & { role: string }) | null
          success: boolean
        }
        const data = payload?.data
        if (!data) return

        const normalized: StaffUserProfile = {
          ...data,
          role: normalizeRole(data.role),
        }

        if (normalized.is_active === false) {
          await supabase.auth.signOut()
          setStaffUser(null)
          setUser(null)
          setSession(null)
          window.location.replace('/login?reason=account_inactive')
          return
        }

        setStaffUser(normalized)
      } catch {
        // Keep existing profile if a transient read fails; avoid dropping role to fallback.
        return
      }
    },
    [supabase]
  )

  const refreshUser = useCallback(async () => {
    if (!supabase) {
      setUser(null)
      setStaffUser(null)
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
    if (user) await fetchStaffProfile(user.id)
  }, [supabase, fetchStaffProfile])

  useEffect(() => {
    let mounted = true

    if (!supabase) {
      setIsLoading(false)
      return () => {
        mounted = false
      }
    }

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!mounted) return
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchStaffProfile(session.user.id)
        }
      })
      .catch(() => {
        if (!mounted) return
        setSession(null)
        setUser(null)
        setStaffUser(null)
      })
      .finally(() => {
        if (!mounted) return
        setIsLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (event === 'SIGNED_OUT') {
        setStaffUser(null)
        if (window.location.pathname !== '/login') {
          window.location.replace('/login?reason=session_expired')
        }
        setIsLoading(false)
        return
      }

      if (session?.user) {
        await fetchStaffProfile(session.user.id)
      }
      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchStaffProfile])

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setStaffUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        staffUser,
        session,
        isLoading,
        // Treat a valid Supabase session as authenticated even if profile lookup
        // is temporarily unavailable, so the UI doesn't deadlock on loaders.
        isAuthenticated: !!session,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
