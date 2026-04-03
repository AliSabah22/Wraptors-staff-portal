import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/helpers'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('services.delete')
    const { id } = await context.params
    if (!id?.trim()) {
      return errorResponse('Missing service id', 400)
    }

    const supabase = await createClient()
    const { data, error } = await supabase.from('services').delete().eq('id', id).select('id').maybeSingle()

    if (error) {
      return errorResponse(error.message)
    }
    if (!data) {
      return notFoundResponse('Service')
    }

    return successResponse({ id: data.id })
  } catch (error) {
    return serverErrorResponse(error)
  }
}
