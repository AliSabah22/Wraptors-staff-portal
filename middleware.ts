// middleware.ts (project root)
// Auth middleware — only activates when NEXT_PUBLIC_SUPABASE_URL is configured.
// While running on mock data (no Supabase), all routes pass through unchanged
// so the existing mock-auth flow is unaffected.
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password', '/auth/callback']

// App API routes handled by the Flutter companion app (own auth)
const APP_API_ROUTES = ['/api/app/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip for static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Allow Flutter app API routes through
  if (APP_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Pass through when Supabase is not yet configured (mock-auth mode)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  // Normalize app root to a concrete destination to avoid client-side spinner
  // fallback loops while auth/layout state hydrates.
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    if (user) {
      url.pathname = '/dashboard'
    } else {
      url.pathname = '/login'
      url.searchParams.set('redirectTo', '/')
    }
    return NextResponse.redirect(url)
  }

  // Not authenticated + not on a public route → redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Already authenticated + on login page → redirect to dashboard
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
