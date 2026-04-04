import { randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/helpers'

const TOKEN_DAYS = 7

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('quotes.edit')
    const { id } = await params
    const admin = createAdminClient()

    const { data: row, error: fetchErr } = await admin
      .from('quote_requests')
      .select('id, status')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr) return errorResponse(fetchErr.message)
    if (!row) return notFoundResponse('Quote request')

    const status = String((row as { status?: string }).status ?? '')
    if (status === 'converted' || status === 'accepted' || status === 'declined') {
      return errorResponse('Quote is no longer pending approval.', 422)
    }

    const token = randomBytes(24).toString('base64url')
    const expires = new Date(Date.now() + TOKEN_DAYS * 86400000).toISOString()

    const { error: upErr } = await admin
      .from('quote_requests')
      .update({
        approval_token: token,
        approval_token_expires_at: expires,
        status: 'quoted',
      })
      .eq('id', id)

    if (upErr) return errorResponse(upErr.message)

    const base =
      (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL)?.replace(/\/$/, '') ?? ''
    const path = `/quotes/approve/${encodeURIComponent(token)}`
    const approval_url = base ? `${base}${path}` : path

    return successResponse({
      approval_url,
      expires_at: expires,
      note: 'Email delivery is not wired; copy the link for the customer.',
    })
  } catch (e) {
    return serverErrorResponse(e)
  }
}
