'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { canAccessRoute, getUnauthorizedRedirect } from '@/lib/auth/access'
import { useRole } from '@/hooks/useRole'
import { useAuth } from '@/hooks/useAuth'

const LOGIN_PATH = '/login'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname()
  const { isLoading, isAuthenticated } = useAuth()
  const { role } = useRole()

  useEffect(() => {
    if (isLoading) return

    if (pathname === LOGIN_PATH) return
    if (!role) return

    const allowed = canAccessRoute(role, pathname)
    if (!allowed) {
      window.location.replace(getUnauthorizedRedirect(role))
    }
  }, [isLoading, isAuthenticated, pathname, role])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-wraptors-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-wraptors-gold border-t-transparent" />
      </div>
    )
  }

  if (pathname === LOGIN_PATH) return <>{children}</>

  // Middleware enforces authentication for protected routes. Avoid client-side
  // redirect loops during auth hydration by rendering children here.
  if (!isAuthenticated) return <>{children}</>

  if (!role) {
    return (
      <div className="flex h-screen items-center justify-center bg-wraptors-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-wraptors-gold border-t-transparent" />
      </div>
    )
  }

  if (!canAccessRoute(role, pathname)) {
    return (
      <div className="flex h-screen items-center justify-center bg-wraptors-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-wraptors-gold border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
