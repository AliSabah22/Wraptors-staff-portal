// Multi-tenant: future shop/workspace scope
export type ShopId = string;

// Roles for RBAC
export type StaffRole =
  | "admin"
  | "ceo"
  | "receptionist"
  | "sales_manager"
  | "technician";

export interface StaffUser {
  id: string;
  shopId: ShopId;
  email: string;
  name: string;
  role: StaffRole;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  shopId: ShopId;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  vehicleIds: string[];
  totalSpend: number;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  shopId: ShopId;
  customerId: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  color?: string;
  vin?: string;
  plate?: string;
  serviceJobIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** Vehicle catalog option for searchable dropdown (synced with DB). */
export interface VehicleCatalogOption {
  id: string;
  year: number;
  make: string;
  model: string;
}

// Job stages aligned with mobile app progress
export const JOB_STAGES = [
  "intake",
  "inspection",
  "prep",
  "disassembly",
  "installation",
  "reassembly",
  "inspection_final",
  "media",
  "ready",
] as const;

export type JobStage = (typeof JOB_STAGES)[number];

export const STAGE_PROGRESS: Record<JobStage, number> = {
  intake: 10,
  inspection: 15,
  prep: 25,
  disassembly: 45,
  installation: 75,
  reassembly: 85,
  inspection_final: 90,
  media: 95,
  ready: 100,
};

export interface JobStageUpdate {
  id: string;
  jobId: string;
  stage: JobStage;
  progress: number;
  note?: string;
  createdAt: string;
  createdBy: string;
}

/** Canonical operational block types for escalation workflow. */
export const BLOCK_TYPE_KEYS = [
  "waiting_for_parts",
  "waiting_for_approval",
  "waiting_for_payment",
  "material_issue",
  "rework_needed",
] as const;

export type BlockTypeKey = (typeof BLOCK_TYPE_KEYS)[number];

export type BlockRequestStatus = "pending" | "approved" | "denied" | "resolved";

/** Structured details per block type (subset of fields; only what's submitted). */
export interface BlockRequestDetailsParts {
  partName: string;
  supplier?: string;
  estimatedArrival?: string;
  notes?: string;
}

export interface BlockRequestDetailsApproval {
  requestReason: string;
  requestNote?: string;
}

export interface BlockRequestDetailsPayment {
  paymentStage: string;
  notes?: string;
}

export interface BlockRequestDetailsMaterial {
  issueType: string;
  notes?: string;
}

export interface BlockRequestDetailsRework {
  reworkReason: string;
  notes?: string;
}

export type BlockRequestDetails =
  | ({ type: "waiting_for_parts" } & BlockRequestDetailsParts)
  | ({ type: "waiting_for_approval" } & BlockRequestDetailsApproval)
  | ({ type: "waiting_for_payment" } & BlockRequestDetailsPayment)
  | ({ type: "material_issue" } & BlockRequestDetailsMaterial)
  | ({ type: "rework_needed" } & BlockRequestDetailsRework);

/** Single operational block request (current or historical). */
export interface OperationalBlockRequest {
  id: string;
  jobId: string;
  type: BlockTypeKey;
  requestedBy: string;
  requestedAt: string;
  status: BlockRequestStatus;
  details: BlockRequestDetails;
  denialReason?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

/** Timeline entry for blocker lifecycle (requested / resolved / approved / denied). */
export interface BlockerHistoryEntry {
  id: string;
  jobId: string;
  kind: "blocker_requested" | "blocker_resolved" | "approval_approved" | "approval_denied";
  blockType: BlockTypeKey;
  requestedBy?: string;
  resolvedBy?: string;
  denialReason?: string;
  details?: BlockRequestDetails;
  createdAt: string;
}

/** Visibility for notes: internal (portal only) or customer_visible (e.g. app timeline). */
export type NoteVisibility = "internal" | "customer_visible";

export interface JobNote {
  id: string;
  text: string;
  visibility: NoteVisibility;
  createdAt: string;
  createdBy?: string;
}

/** Operational status (separate from workflow stage). */
export type JobStatus =
  | "active"
  | "blocked"
  | "on_hold"
  | "ready_for_pickup"
  | "completed"
  | "cancelled";

export type JobPriority = "low" | "standard" | "urgent" | "rush";

export interface ServiceJob {
  id: string;
  shopId: ShopId;
  customerId: string;
  vehicleId: string;
  serviceId: string;
  assignedTechnicianId?: string;
  stage: JobStage;
  progress: number;
  /** Operational status; defaults to active. */
  status?: JobStatus;
  /** Priority for scheduling; defaults to standard. */
  priority?: JobPriority;
  dueDate: string;
  /** When the vehicle is expected to come in (for calendar drop-offs). */
  dropOffDate?: string;
  scheduledStartDate?: string;
  pickupTargetTime?: string;
  estimatedDurationMinutes?: number;
  isBlocked?: boolean;
  blockerReason?: string;
  blockedAt?: string;
  blockedBy?: string;
  /** Current structured block request when job is blocked; cleared when resolved. */
  blockerRequest?: OperationalBlockRequest;
  /** History of blocker events for timeline/activity. */
  blockerHistory?: BlockerHistoryEntry[];
  stageUpdates: JobStageUpdate[];
  /** Notes with visibility. When present, prefer over legacy notes[]. */
  jobNotes?: JobNote[];
  /** @deprecated Prefer jobNotes[]. Kept for backward compat / migration. */
  notes: string[];
  mediaIds: string[];
  /** When job was created from an accepted quote, store the quote total for reference. */
  quoteTotal?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type QuoteStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "negotiating"
  | "booked"
  | "lost";

export type QuoteSource = "mobile_app" | "phone" | "walk_in" | "web" | "in_person";

export interface QuoteRequest {
  id: string;
  shopId: ShopId;
  customerId?: string;
  vehicleId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  vehicleDescription?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleColor?: string;
  serviceIds: string[];
  status: QuoteStatus;
  estimatedAmount?: number;
  notes?: string;
  source: QuoteSource;
  createdAt: string;
  updatedAt: string;
  convertedToJobId?: string;
}

export type PipelineStage =
  | "lead"
  | "consultation"
  | "quote_sent"
  | "follow_up"
  | "booked"
  | "lost";

/** Source identifier for pipeline leads (e.g. Meta Lead Ads). */
export const PIPELINE_LEAD_SOURCE_META = "meta_lead_ads";

export interface PipelineLead {
  id: string;
  shopId: ShopId;
  quoteRequestId?: string;
  customerId?: string;
  name: string;
  contact: string;
  stage: PipelineStage;
  value?: number;
  notes?: string;
  /** Lead source for display (e.g. meta_lead_ads). */
  source?: string;
  /** Form name when lead came from Meta Lead Ads. */
  formName?: string;
  /** External ID from the ad platform. */
  externalLeadId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Incoming Meta Lead Ads submission payload (demo or webhook). */
export interface MetaLeadSubmissionPayload {
  externalLeadId: string;
  formName: string;
  fullName: string;
  phone?: string;
  email?: string;
  /** Form answers / service interest summary. */
  answers?: string;
  submittedAt: string;
  pageName?: string;
  campaignName?: string;
}

/** Demo Meta integration config (persisted in store or later backend). */
export interface MetaIntegrationConfig {
  connected: boolean;
  selectedPageId: string | null;
  selectedFormIds: string[];
  syncToPipelineEnabled: boolean;
}

export interface Invoice {
  id: string;
  shopId: ShopId;
  jobId: string;
  customerId: string;
  vehicleId: string;
  amount: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "paid";
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Visibility for customer app sync: internal (portal only) or customer_visible. */
export type MediaVisibility = "internal" | "customer_visible";

export interface MediaAsset {
  id: string;
  shopId: ShopId;
  jobId?: string;
  customerId?: string;
  vehicleId?: string;
  type: "photo" | "video";
  url: string;
  thumbnailUrl?: string;
  title?: string;
  caption?: string;
  /** Defaults to internal; customer_visible is eligible for app timeline. */
  visibility?: MediaVisibility;
  uploadedBy: string;
  createdAt: string;
}

export type NotificationType =
  | "new_quote"
  | "job_update"
  | "vehicle_ready"
  | "quote_converted"
  | "job_assigned"
  | "job_blocker"
  | "job_blocker_resolved"
  | "meta_lead"
  | "system"
  | "chat_mention"
  | "chat_message";

/** Chat thread type: job-linked, direct message, or channel. */
export type ChatThreadType = "job" | "dm" | "channel";

export interface ChatThread {
  id: string;
  type: ChatThreadType;
  title: string;
  participantIds: string[];
  jobId?: string;
  channelKey?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
  mentionUserIds: string[];
  /** Optional for future file attachments. */
  attachmentIds?: string[];
  messageType?: "text" | "system";
}

/** Fixed channel definition (Operations, Shop Floor, Announcements). */
export interface ChatChannelDef {
  key: string;
  name: string;
  description: string;
  /** Roles that can see and post. CEO can always see all. */
  allowedRoles: ("ceo" | "receptionist" | "technician")[];
  /** If true, only CEO (or admin) can post; others read-only. */
  announceOnly?: boolean;
}

export interface NotificationItem {
  id: string;
  shopId: ShopId;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export type ServiceCategory =
  | "full_wrap"
  | "ppf"
  | "ceramic_coating"
  | "tint"
  | "chrome_delete"
  | "detailing"
  | "custom";

export interface Service {
  id: string;
  shopId: ShopId;
  name: string;
  category?: ServiceCategory;
  description: string;
  estimatedPrice: number;
  estimatedPriceMin?: number;
  estimatedPriceMax?: number;
  estimatedHours?: number;
  active: boolean;
  featured?: boolean;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

// ——— Smart Quote Builder (demo) ———

export type QuoteTemplateCategory = "ppf" | "wrap" | "tint" | "coating" | "detailing";
export type QuoteTier = "good" | "better" | "best";

export interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: QuoteTemplateCategory;
  tier: QuoteTier;
  materialBrand: string | null;
  warrantyYears: number | null;
  estimatedHours: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleClassMultiplier {
  id: string;
  label: string;
  multiplier: number;
  exampleVehicles: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteAddon {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  isVehicleAdjusted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SmartQuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export interface VehicleSnapshot {
  year: number;
  make: string;
  model: string;
  color?: string;
  trim?: string;
}

export interface SmartQuote {
  id: string;
  quoteNumber: string;
  customerId: string | null;
  pipelineLeadId: string | null;
  vehicleId: string | null;
  vehicleSnapshot: VehicleSnapshot | null;
  vehicleClassMultiplierId: string;
  createdByUserId: string;
  status: SmartQuoteStatus;
  selectedTier: QuoteTier | null;
  subtotal: number;
  discountAmount: number;
  discountRequiresApproval: boolean;
  discountApprovedByUserId: string | null;
  total: number;
  notes: string | null;
  validUntil: string;
  sentAt: string | null;
  acceptedAt: string | null;
  convertedToJobId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type QuoteLineItemType = "service" | "addon";

export interface QuoteLineItem {
  id: string;
  quoteId: string;
  type: QuoteLineItemType;
  quoteTemplateId: string | null;
  quoteAddonId: string | null;
  tier: QuoteTier | null;
  label: string;
  basePrice: number;
  multiplierApplied: number;
  finalPrice: number;
  createdAt: string;
}

export interface QuoteFollowUp {
  id: string;
  quoteId: string;
  scheduledFor: string;
  completedAt: string | null;
  notes: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}
