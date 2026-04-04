import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'

function normalizeVin(raw: string): string | null {
  const v = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (v.length !== 17) return null
  if (/[IOQ]/.test(v)) return null
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(v)) return null
  return v
}

type NhtsaResult = Record<string, string>

export async function GET(request: Request) {
  try {
    await requirePermission('vehicles.view')
    const vinParam = new URL(request.url).searchParams.get('vin')
    if (!vinParam) return errorResponse('Missing vin query parameter', 400)

    const vin = normalizeVin(vinParam)
    if (!vin) {
      return errorResponse(
        'VIN must be 17 characters and cannot contain letters I, O, or Q.',
        422
      )
    }

    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvaluesextended/${encodeURIComponent(vin)}?format=json`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return errorResponse('NHTSA lookup failed', 502)

    const json = (await res.json()) as {
      Results?: NhtsaResult[]
    }
    const row = json.Results?.[0]
    if (!row) return errorResponse('No decode result from NHTSA', 502)

    const make = (row.Make ?? '').trim()
    const model = (row.Model ?? '').trim()
    const yearStr = (row.ModelYear ?? '').trim()
    const year = parseInt(yearStr, 10)

    if (!make || !model || Number.isNaN(year) || year < 1900) {
      return errorResponse('Could not decode make, model, and year from this VIN.', 422)
    }

    return successResponse({ vin, make, model, year })
  } catch (e) {
    return serverErrorResponse(e)
  }
}
