// lib/api/helpers.ts
// Standardised API response helpers for Next.js Route Handlers.
import { NextResponse } from 'next/server'

export interface ApiResponse<T = unknown> {
  data: T | null
  error: string | null
  success: boolean
}

export function successResponse<T>(data: T, status = 200) {
  const body: ApiResponse<T> = { data, error: null, success: true }
  return NextResponse.json(body, { status })
}

export function errorResponse(message: string, status = 400) {
  const body: ApiResponse = { data: null, error: message, success: false }
  return NextResponse.json(body, { status })
}

export function unauthorizedResponse() {
  return errorResponse('Unauthorized', 401)
}

export function notFoundResponse(resource = 'Resource') {
  return errorResponse(`${resource} not found`, 404)
}

export function serverErrorResponse(error: unknown) {
  console.error('[API Error]', error)
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'
  return errorResponse(message, 500)
}
