import Papa from 'papaparse'
import { z } from 'zod'

/** Canonical CSV column order (export + template). RFC 4180, UTF-8. */
export const CUSTOMER_CSV_COLUMNS = [
  'full_name',
  'email',
  'phone',
  'membership_status',
  'notes',
  'source',
] as const

export type CustomerCsvColumn = (typeof CUSTOMER_CSV_COLUMNS)[number]

/** Matches POST /api/customers CreateCustomerSchema for insert payloads. */
export const customerCsvRowInsertSchema = z.object({
  full_name: z.string().min(2, 'full_name must be at least 2 characters'),
  email: z.string().email('invalid email'),
  phone: z.string().optional().nullable(),
  membership_status: z.enum(['none', 'active', 'expired', 'cancelled']).optional(),
  notes: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
})

export type CustomerCsvInsertRow = z.infer<typeof customerCsvRowInsertSchema>

const UTF8_BOM = '\uFEFF'

/** Normalize header cell to canonical column key, or null if unknown. */
export function normalizeHeaderKey(header: string): CustomerCsvColumn | null {
  const slug = header.trim().toLowerCase().replace(/\s+/g, '_')
  const emailAliases = ['email', 'e_mail', 'e-mail', 'mail']
  if (emailAliases.includes(slug)) return 'email'
  if (slug === 'name' || slug === 'customer_name' || slug === 'full_name') return 'full_name'
  if (
    slug === 'phone' ||
    slug === 'mobile' ||
    slug === 'phone_number' ||
    slug === 'tel'
  ) {
    return 'phone'
  }
  if (slug === 'notes' || slug === 'note') return 'notes'
  if (slug === 'membership_status' || slug === 'membership') return 'membership_status'
  if (slug === 'source' || slug === 'lead_source') return 'source'
  if ((CUSTOMER_CSV_COLUMNS as readonly string[]).includes(slug)) {
    return slug as CustomerCsvColumn
  }
  return null
}

function remapCsvRow(raw: Record<string, unknown>): Partial<Record<CustomerCsvColumn, string>> {
  const out: Partial<Record<CustomerCsvColumn, string>> = {}
  for (const [key, val] of Object.entries(raw)) {
    const canon = normalizeHeaderKey(key)
    if (!canon) continue
    const s = val == null ? '' : String(val).trim()
    out[canon] = s
  }
  return out
}

function coalesceInsertRow(remapped: Partial<Record<CustomerCsvColumn, string>>): unknown {
  const membershipRaw = remapped.membership_status?.trim() ?? ''
  const membership_status =
    membershipRaw === ''
      ? 'none'
      : (membershipRaw as CustomerCsvInsertRow['membership_status'])

  return {
    full_name: remapped.full_name?.trim() ?? '',
    email: remapped.email?.trim().toLowerCase() ?? '',
    phone: remapped.phone?.trim() ? remapped.phone.trim() : null,
    membership_status,
    notes: remapped.notes?.trim() ? remapped.notes.trim() : null,
    source: remapped.source?.trim() ? remapped.source.trim() : null,
  }
}

export type CsvParseMeta = {
  rowCount: number
  parseErrors: string[]
}

export type ValidatedCsvRow =
  | { rowNumber: number; ok: true; insert: CustomerCsvInsertRow }
  | { rowNumber: number; ok: false; message: string }

/**
 * Parse CSV text and validate each data row. Row numbers are 1-based including header
 * (row 1 = header, first data row = 2) for user-facing error messages.
 */
export function parseAndValidateCustomerCsv(csvText: string, maxRows: number): {
  meta: CsvParseMeta
  rows: ValidatedCsvRow[]
} {
  const parseErrors: string[] = []
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  })

  if (parsed.errors.length) {
    for (const e of parsed.errors) {
      parseErrors.push(e.message ?? 'parse error')
    }
  }

  const data = parsed.data ?? []
  if (data.length > maxRows) {
    return {
      meta: { rowCount: data.length, parseErrors: [`Too many rows (max ${maxRows})`] },
      rows: [],
    }
  }

  const rows: ValidatedCsvRow[] = []
  // Papa: row index 0 = first data row → display row number = index + 2 (after header)
  data.forEach((raw, i) => {
    const rowNumber = i + 2
    const remapped = remapCsvRow(raw)
    const isEmpty =
      !remapped.full_name &&
      !remapped.email &&
      !remapped.phone &&
      !remapped.notes &&
      !remapped.membership_status &&
      !remapped.source
    if (isEmpty) return

    const coalesced = coalesceInsertRow(remapped)
    const result = customerCsvRowInsertSchema.safeParse(coalesced)
    if (!result.success) {
      const msg = result.error.errors.map((e) => e.message).join('; ')
      rows.push({ rowNumber, ok: false, message: msg })
      return
    }
    rows.push({ rowNumber, ok: true, insert: result.data })
  })

  return {
    meta: { rowCount: data.length, parseErrors },
    rows,
  }
}

export type CustomerExportRow = {
  full_name: string
  email: string
  phone: string | null
  membership_status: string | null
  notes: string | null
  source: string | null
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Build CSV string with UTF-8 BOM for Excel; columns match CUSTOMER_CSV_COLUMNS. */
export function customersToCsvString(rows: CustomerExportRow[]): string {
  const header = CUSTOMER_CSV_COLUMNS.join(',')
  const lines = [header]
  for (const r of rows) {
    const cells = CUSTOMER_CSV_COLUMNS.map((col) => {
      const v = r[col as keyof CustomerExportRow]
      const s = v == null ? '' : String(v)
      return escapeCsvField(s)
    })
    lines.push(cells.join(','))
  }
  return UTF8_BOM + lines.join('\r\n')
}

export function customerCsvTemplateString(): string {
  return UTF8_BOM + CUSTOMER_CSV_COLUMNS.join(',') + '\r\n'
}
