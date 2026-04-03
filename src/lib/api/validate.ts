import { z } from 'zod'
import { errorResponse } from '@/lib/api/helpers'

export async function parseBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | { error: ReturnType<typeof errorResponse> }> {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.errors
        .map((entry) => `${entry.path.join('.')}: ${entry.message}`)
        .join(', ')
      return { error: errorResponse(`Validation failed: ${message}`) }
    }

    return { data: parsed.data }
  } catch {
    return { error: errorResponse('Invalid JSON body') }
  }
}
