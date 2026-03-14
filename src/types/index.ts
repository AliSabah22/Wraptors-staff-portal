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
  stageUpdates: JobStageUpdate[];
  /** Notes with visibility. When present, prefer over legacy notes[]. */
  jobNotes?: JobNote[];
  /** @deprecated Prefer jobNotes[]. Kept for backward compat / migration. */
  notes: string[];
  mediaIds: string[];
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
  createdAt: string;
  updatedAt: string;
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
  | "system";

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
