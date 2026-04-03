// App-facing: React Native offers feed — active, in-app, non-expired campaigns
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const today = new Date().toISOString().split('T')[0]
    const membersOnly = searchParams.get('members_only') === 'true'

    let query = supabase
      .from('campaigns')
      .select(
        `
        id,
        title,
        offer_headline,
        offer_body,
        offer_cta,
        offer_code,
        discount_type,
        discount_value,
        start_date,
        end_date,
        members_only,
        channels,
        type,
        target_label
      `
      )
      .eq('status', 'active')
      .gte('end_date', today)
      .contains('channels', { in_app: true })
      .order('created_at', { ascending: false })

    if (!membersOnly) {
      query = query.eq('members_only', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('[active-offers]', error)
      return errorResponse(error.message)
    }

    return successResponse({ offers: data ?? [] })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
