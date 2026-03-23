import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/helpers'
import { getCurrentUser } from '@/lib/auth/helpers'

/**
 * Placeholder: returns active in-app campaigns for the Flutter app.
 * TODO: Add auth for the Flutter app (e.g. API key or session).
 * TODO: Replace with real data source when persistence is wired.
 */
export async function GET() {
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const user = await getCurrentUser()
      if (!user) return unauthorizedResponse()
    }

    const offers: unknown[] = []
    return successResponse({ offers })
  } catch (error) {
    return serverErrorResponse(error)
  }
}
