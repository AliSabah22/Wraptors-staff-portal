import { getCurrentUser } from '@/lib/auth/helpers'
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/helpers'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorizedResponse()
    return successResponse(user)
  } catch (error) {
    return serverErrorResponse(error)
  }
}
