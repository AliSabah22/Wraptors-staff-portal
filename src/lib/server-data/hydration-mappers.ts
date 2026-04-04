import type {
  Campaign,
  CampaignAudienceType,
  CampaignChannels,
  CampaignMockSent,
  Customer,
  JobStage,
  JobStatus,
  MediaAsset,
  PipelineLead,
  QuoteRequest,
  QuoteSource,
  QuoteStatus,
  Service,
  ServiceJob,
  Vehicle,
} from '@/types'
import { STAGE_PROGRESS } from '@/types'

function iso(d: string | null | undefined): string {
  if (!d) return new Date().toISOString()
  return d.includes('T') ? d : `${d}T12:00:00.000Z`
}

export function mapDbCustomerRowToCustomer(row: Record<string, unknown>): Customer {
  const vehicles = row.vehicles as { id?: string }[] | null | undefined
  const vehicleIds = Array.isArray(vehicles) ? vehicles.map((v) => String(v.id)).filter(Boolean) : []
  const now = iso(row.updated_at as string | null)
  return {
    id: String(row.id),
    shopId: '',
    name: String(row.full_name ?? ''),
    phone: String(row.phone ?? ''),
    email: row.email != null ? String(row.email) : undefined,
    notes: row.notes != null ? String(row.notes) : undefined,
    vehicleIds,
    totalSpend: 0,
    createdAt: iso(row.created_at as string | null),
    updatedAt: now,
  }
}

export function mapDbVehicleRowToVehicle(row: Record<string, unknown>): Vehicle {
  const now = iso(row.updated_at as string | null)
  return {
    id: String(row.id),
    shopId: '',
    customerId: String(row.customer_id),
    make: String(row.make ?? ''),
    model: String(row.model ?? ''),
    year: Number(row.year ?? 0),
    color: row.color != null ? String(row.color) : undefined,
    vin: row.vin != null ? String(row.vin) : undefined,
    plate: row.license_plate != null ? String(row.license_plate) : undefined,
    serviceJobIds: [],
    createdAt: iso(row.created_at as string | null),
    updatedAt: now,
  }
}

export function buildServiceNameToIdMap(
  rows: Array<Record<string, unknown>>
): Map<string, string> {
  const m = new Map<string, string>()
  for (const r of rows) {
    const name = String(r.name ?? '').trim().toLowerCase()
    if (name) m.set(name, String(r.id))
  }
  return m
}

export function dbJobStatusToJobStage(status: string): JobStage {
  switch (status) {
    case 'intake':
      return 'intake'
    case 'in_progress':
      return 'installation'
    case 'quality_check':
      return 'inspection_final'
    case 'ready_for_pickup':
    case 'completed':
      return 'ready'
    case 'cancelled':
      return 'intake'
    default:
      return 'intake'
  }
}

export function dbJobStatusToOperationalStatus(status: string): JobStatus {
  if (status === 'cancelled') return 'cancelled'
  if (status === 'completed') return 'completed'
  if (status === 'ready_for_pickup') return 'ready_for_pickup'
  return 'active'
}

export function mapDbJobRowToServiceJob(
  row: Record<string, unknown>,
  serviceNameToId: Map<string, string>
): ServiceJob {
  const services = (row.services as string[]) ?? []
  const first = services[0]?.trim().toLowerCase() ?? ''
  let serviceId = first ? serviceNameToId.get(first) : undefined
  if (!serviceId && serviceNameToId.size > 0) {
    serviceId = [...serviceNameToId.values()][0]
  }
  if (!serviceId) serviceId = ''

  const dbStatus = String(row.status ?? 'intake')
  const stage = dbJobStatusToJobStage(dbStatus)
  const progress = STAGE_PROGRESS[stage]
  const now = new Date().toISOString()
  const createdAt = iso(row.created_at as string | null)
  const updatedAt = iso(row.updated_at as string | null)
  const startDate = row.start_date != null ? String(row.start_date) : undefined
  const endDate = row.end_date != null ? String(row.end_date) : undefined

  return {
    id: String(row.id),
    shopId: '',
    customerId: String(row.customer_id),
    vehicleId: String(row.vehicle_id),
    serviceId,
    assignedTechnicianId:
      row.technician_id != null && row.technician_id !== ''
        ? String(row.technician_id)
        : undefined,
    stage,
    progress,
    status: dbJobStatusToOperationalStatus(dbStatus),
    dbJobStatus: dbStatus,
    priority: 'standard',
    dueDate: endDate ?? startDate ?? createdAt.slice(0, 10),
    scheduledStartDate: startDate,
    dropOffDate: startDate,
    stageUpdates: [
      {
        id: `hydrated_${row.id}_${stage}`,
        jobId: String(row.id),
        stage,
        progress,
        createdAt,
        createdBy: String(row.created_by ?? 'system'),
      },
    ],
    notes: row.notes != null && String(row.notes) ? [String(row.notes)] : [],
    mediaIds: [],
    quoteTotal: row.price != null ? Number(row.price) : undefined,
    createdAt,
    updatedAt,
    completedAt: dbStatus === 'completed' ? updatedAt : undefined,
  }
}

export function mapDbJobRowToServiceJobWithMedia(
  row: Record<string, unknown>,
  serviceNameToId: Map<string, string>
): { job: ServiceJob; mediaItems: MediaAsset[] } {
  const job = mapDbJobRowToServiceJob(row, serviceNameToId)
  const rawMedia = row.job_media as Record<string, unknown>[] | null | undefined
  const mediaItems: MediaAsset[] = []
  const mediaIds: string[] = []
  let before = 0
  let after = 0
  let progress = 0
  if (Array.isArray(rawMedia)) {
    for (const m of rawMedia) {
      const id = String(m.id)
      mediaIds.push(id)
      const kind = String(m.type ?? 'progress')
      if (kind === 'before') before += 1
      else if (kind === 'after') after += 1
      else progress += 1
      mediaItems.push({
        id,
        shopId: '',
        jobId: job.id,
        customerId: job.customerId,
        vehicleId: job.vehicleId,
        type: 'photo',
        jobMediaKind: kind === 'before' || kind === 'after' || kind === 'progress' ? kind : 'progress',
        url: String(m.url ?? ''),
        caption: m.caption != null ? String(m.caption) : undefined,
        uploadedBy: m.uploaded_by != null ? String(m.uploaded_by) : 'system',
        createdAt: iso(m.created_at as string | null),
      })
    }
  }
  return {
    job: {
      ...job,
      mediaIds,
      jobMediaSummary: { before, after, progress },
    },
    mediaItems,
  }
}

const DB_QUOTE_STATUS_TO_UI: Record<string, QuoteStatus> = {
  new: 'new',
  contacted: 'contacted',
  quoted: 'quoted',
  accepted: 'booked',
  declined: 'lost',
  converted: 'booked',
}

const DB_QUOTE_SOURCE_TO_UI: Record<string, QuoteSource> = {
  app: 'mobile_app',
  website: 'web',
  phone: 'phone',
  walk_in: 'walk_in',
  meta_ads: 'web',
  referral: 'web',
  other: 'web',
}

export function mapDbQuoteRowToQuoteRequest(row: Record<string, unknown>): QuoteRequest {
  const dbStatus = String(row.status ?? 'new')
  const status = DB_QUOTE_STATUS_TO_UI[dbStatus] ?? 'new'
  const src = String(row.source ?? 'app')
  const source = DB_QUOTE_SOURCE_TO_UI[src] ?? 'web'
  const services = (row.services_requested as string[]) ?? []
  const veh = row.vehicles as Record<string, unknown> | null | undefined
  const vehicleDescription =
    veh && typeof veh === 'object'
      ? `${veh.make ?? ''} ${veh.model ?? ''} (${veh.year ?? '—'})`.trim()
      : undefined

  return {
    id: String(row.id),
    shopId: '',
    customerId: row.customer_id != null ? String(row.customer_id) : undefined,
    vehicleId: row.vehicle_id != null ? String(row.vehicle_id) : undefined,
    customerName: String(row.customer_name ?? ''),
    customerPhone: String(row.customer_phone ?? ''),
    customerEmail: row.customer_email != null ? String(row.customer_email) : undefined,
    vehicleDescription,
    vehicleMake: veh?.make != null ? String(veh.make) : undefined,
    vehicleModel: veh?.model != null ? String(veh.model) : undefined,
    vehicleYear: veh?.year != null ? Number(veh.year) : undefined,
    serviceIds: services,
    status,
    estimatedAmount: row.estimated_value != null ? Number(row.estimated_value) : undefined,
    notes: row.notes != null ? String(row.notes) : undefined,
    source,
    createdAt: iso(row.created_at as string | null),
    updatedAt: iso(row.updated_at as string | null),
    convertedToJobId:
      row.converted_job_id != null ? String(row.converted_job_id) : undefined,
  }
}

function parseChannels(raw: unknown): CampaignChannels {
  const ch = raw as Record<string, unknown> | null | undefined
  return {
    in_app: ch?.in_app !== false,
    email: !!ch?.email,
    sms: !!ch?.sms,
  }
}

function parseMockSent(raw: unknown): CampaignMockSent {
  const m = raw as Record<string, unknown> | null | undefined
  return {
    in_app: Number(m?.in_app ?? 0),
    email: Number(m?.email ?? 0),
    sms: Number(m?.sms ?? 0),
  }
}

export function mapDbRowToCampaign(row: Record<string, unknown>): Campaign {
  return {
    id: String(row.id),
    title: String(row.title),
    type: row.type as Campaign['type'],
    target_id: row.target_id != null ? String(row.target_id) : null,
    target_label: String(row.target_label ?? ''),
    status: row.status as Campaign['status'],
    offer_headline: String(row.offer_headline ?? ''),
    offer_body: String(row.offer_body ?? ''),
    offer_cta: String(row.offer_cta ?? ''),
    offer_code: row.offer_code != null ? String(row.offer_code) : null,
    discount_type: row.discount_type as Campaign['discount_type'],
    discount_value: row.discount_value != null ? Number(row.discount_value) : null,
    start_date: String(row.start_date ?? '').slice(0, 10),
    end_date: String(row.end_date ?? '').slice(0, 10),
    max_redemptions: row.max_redemptions != null ? Number(row.max_redemptions) : null,
    members_only: !!row.members_only,
    audience_type: row.audience_type as CampaignAudienceType,
    audience_params:
      row.audience_params != null && typeof row.audience_params === 'object'
        ? (row.audience_params as Record<string, unknown>)
        : null,
    channels: parseChannels(row.channels),
    ai_generated: !!row.ai_generated,
    mock_reach: Number(row.mock_reach ?? 0),
    mock_sent: parseMockSent(row.mock_sent),
    mock_opens: Number(row.mock_opens ?? 0),
    mock_clicks: Number(row.mock_clicks ?? 0),
    created_by: String(row.created_by ?? ''),
    created_at: iso(row.created_at as string | null),
    updated_at: iso(row.updated_at as string | null),
    published_at: row.published_at != null ? iso(String(row.published_at)) : null,
    scheduled_at: row.scheduled_at != null ? iso(String(row.scheduled_at)) : null,
  }
}

export function mapDbServiceRowToService(row: Record<string, unknown>): Service {
  const now = iso(row.updated_at as string | null)
  return {
    id: String(row.id),
    shopId: '',
    name: String(row.name ?? ''),
    category: row.category as Service['category'],
    description: String(row.description ?? ''),
    estimatedPrice: Number(row.base_price ?? 0),
    estimatedHours: row.duration_hours != null ? Number(row.duration_hours) : undefined,
    active: row.is_active !== false,
    createdAt: iso(row.created_at as string | null),
    updatedAt: now,
  }
}

export function pipelineItemToLead(item: Record<string, unknown>): PipelineLead | null {
  const stageId = String(item.stage_id)
  const now = new Date().toISOString()
  const qr = item.quote_requests as Record<string, unknown> | null | undefined
  const job = item.jobs as Record<string, unknown> | null | undefined

  if (qr && typeof qr === 'object' && qr.id != null) {
    const services = (qr.services_requested as string[]) ?? []
    return {
      id: String(item.id),
      shopId: '',
      quoteRequestId: String(qr.id),
      customerId: qr.customer_id != null ? String(qr.customer_id) : undefined,
      name: String(qr.customer_name ?? 'Quote'),
      contact:
        [qr.customer_phone, qr.customer_email].filter(Boolean).join(' · ') || '—',
      stage: 'lead',
      pipelineItemId: String(item.id),
      pipelineColumnId: stageId,
      value: qr.estimated_value != null ? Number(qr.estimated_value) : undefined,
      notes:
        services.length > 0
          ? services.join(', ')
          : qr.notes != null
            ? String(qr.notes)
            : undefined,
      source: typeof qr.source === 'string' ? qr.source : undefined,
      createdAt: iso(qr.created_at as string | null),
      updatedAt: iso(item.updated_at as string | null),
    }
  }

  if (job && typeof job === 'object' && job.id != null) {
    const cust = job.customers as { full_name?: string } | null | undefined
    const veh = job.vehicles as { make?: string; model?: string; year?: number } | null | undefined
    const label = veh
      ? `${veh.make ?? ''} ${veh.model ?? ''} (${veh.year ?? '—'})`
      : String(job.status ?? '—')
    const svc = Array.isArray(job.services) ? (job.services as string[]).join(', ') : undefined
    return {
      id: String(item.id),
      shopId: '',
      customerId: String(job.customer_id),
      name: cust?.full_name ?? 'Job',
      contact: label,
      stage: 'lead',
      pipelineItemId: String(item.id),
      pipelineColumnId: stageId,
      value: job.price != null ? Number(job.price) : undefined,
      notes: svc,
      createdAt: iso(job.created_at as string | null),
      updatedAt: iso(item.updated_at as string | null),
    }
  }

  return null
}

export function pipelineBoardToColumnsAndLeads(
  stages: Array<Record<string, unknown>>,
  items: Array<Record<string, unknown>>
): { columns: { id: string; title: string }[]; leads: PipelineLead[] } {
  const sorted = [...stages].sort(
    (a, b) => Number(a.position ?? 0) - Number(b.position ?? 0)
  )
  const columns = sorted.map((s) => ({
    id: String(s.id),
    title: String(s.name ?? 'Stage'),
  }))
  const leads: PipelineLead[] = []
  for (const item of items) {
    const lead = pipelineItemToLead(item)
    if (lead) leads.push(lead)
  }
  return { columns, leads }
}
