    # Wraptors Staff Portal — Product & Codebase Audit

    **Date:** March 2025  
    **Scope:** Full quality, architecture, and product progression audit vs. intended system vision  
    **Build type:** Demo (future production infrastructure)

    ---

    ## SECTION 1 — EXISTING SYSTEM OVERVIEW

    ### Customer system
    - **Implementation:** `Customer` type in `src/types/index.ts` (id, shopId, name, phone, email?, notes?, vehicleIds[], totalSpend, createdAt, updatedAt). Store: `src/stores/customers.ts` (Zustand) with add, update, delete, getById, addVehicleToCustomer. Mock data in `src/data/mock.ts`.
    - **UI:** Customers list page (`/customers`), customer detail (`/customers/[id]`), Add Customer modal (standalone and from header), customer profile modal, delete-customer-options dialog. Add Customer creates only a customer; success step offers View customer, Add vehicle, Create quote, Create job.
    - **Duplicate detection:** `src/lib/duplicate-warnings.ts` — `checkDuplicateCustomer(customers, { phone, email })` used in Add Customer modal; "use existing or create anyway" flow present.

    ### Vehicle system
    - **Implementation:** `Vehicle` type (id, shopId, customerId, make, model, year, trim?, color?, vin?, plate?, serviceJobIds[], createdAt, updatedAt). Store: `src/stores/vehicles.ts` (add, getById, addJobToVehicle). No `notes` field on Vehicle.
    - **UI:** Vehicles linked from customer profile; create-job flow can create customer + vehicle + job. Vehicle search/select component exists. No standalone "Add Vehicle" duplicate check for VIN/plate.

    ### Quote system
    - **Implementation:** `QuoteRequest` type (id, shopId, customerId?, vehicleId?, customerName, customerPhone, customerEmail?, vehicleDescription?, vehicleMake/Model/Year/Color?, serviceIds[], status, estimatedAmount?, notes?, source, convertedToJobId?, etc.). Store: `src/stores/quotes.ts`.
    - **UI:** Quote requests list (`/quote-requests`), detail, new quote modal. Convert-to-job linkage via `convertedToJobId`. No duplicate-quote warning (e.g. same customer/vehicle/service).

    ### Pipeline system
    - **Implementation:** `PipelineLead` type (id, shopId, quoteRequestId?, customerId?, name, contact, stage, value?, notes?). Store: `src/stores/pipeline.ts`. Pipeline stages: lead, consultation, quote_sent, follow_up, booked, lost.
    - **UI:** Pipeline page with kanban (`/pipeline`), lead profile modal. Separate from quotes; can reference quoteRequestId.

    ### Job system
    - **Implementation:** `ServiceJob` in types: id, shopId, customerId, vehicleId, serviceId, assignedTechnicianId?, stage, progress, status?, priority?, dueDate, dropOffDate?, scheduledStartDate?, pickupTargetTime?, estimatedDurationMinutes?, isBlocked?, blockerReason?, blockedAt?, blockedBy?, stageUpdates[], jobNotes?, notes[], mediaIds[], createdAt, updatedAt, completedAt?. Store: `src/stores/jobs.ts` with updateJobStage, setJobStatus, setJobPriority, setJobBlocker, setScheduledStartDate, setPickupTargetTime, setDropOffDate, setDueDate, addJobNote, assignTechnician, addMediaToJob, addJob.
    - **UI:** Active Jobs page (`/jobs`) with kanban and table views, job detail (`/jobs/[id]`), create-job modal (new or existing client, then job params including service, due date, technician, priority). Job detail includes Scheduling & Assignment card and Operational status card.

    ### Calendar
    - **Implementation:** `src/lib/calendar/job-events.ts` — builds events from jobs only (no freeform events). Event types: drop_off, scheduled_start, due, pickup, pickup_target. Uses dropOffDate, scheduledStartDate, dueDate, pickupTargetTime, stage, completedAt. Helpers: filterEventsByRange, groupEventsByDate, getWeekDates, getMonthGrid. Risk flags: isBlocked, isUnassigned, isOverdue, isAtRisk (early stage + due soon).
    - **UI:** Calendar page with day/week/month view, summary cards (Drop-offs today, Due today, Pickups today, Unscheduled jobs, Blocked/At risk), main grid, right panel (Unscheduled jobs, Upcoming pickups, Technician workload). Filters: technician, service, status. Event cards link to job detail.

    ### Media
    - **Implementation:** `MediaAsset` type (id, shopId, jobId?, customerId?, vehicleId?, type, url, thumbnailUrl?, title?, caption?, visibility?, uploadedBy, createdAt). Store: `src/stores/media.ts`. Data scope: `getScopedMedia(role, userId, items, jobs)` — CEO/receptionist see all; technician sees assigned-job media + own uploads.
    - **UI:** Media library page (`/media`) uses scoped media; upload modal. Job detail has media upload with "Visibility for next upload" (internal / customer_visible). Media displayed in job detail grid with visibility on asset.

    ### Notes
    - **Implementation:** Jobs have `jobNotes?: JobNote[]` (id, text, visibility, createdAt, createdBy) and legacy `notes: string[]`. `getJobNotesForDisplay(job)` in `src/lib/job-notes.ts` prefers jobNotes, falls back to legacy notes as internal. Store appends to both on addJobNote.
    - **UI:** Job detail "Notes" card with visibility selector (Internal / Customer visible) when adding; list shows visibility badge. Central config: `VISIBILITY_OPTIONS` in job-workflow config.

    ### Timeline
    - **Implementation:** No dedicated `timelineEvents[]` model. "Activity log" on job detail is derived: single list of "Job created" (job.createdAt) plus `job.stageUpdates` entries, sorted by date. Each entry is date + label (e.g. "Stage updated to Installation (75%)").
    - **Missing:** No automatic logging of status change, note added, media uploaded, technician assigned, priority/due/scheduled/pickup changes, blocker added/resolved. Only stage updates and job creation are shown.

    ### Scheduling fields
    - **Implementation:** Job has dueDate, dropOffDate, scheduledStartDate, pickupTargetTime. Store exposes setScheduledStartDate, setPickupTargetTime, setDropOffDate, setDueDate. Job detail "Scheduling & Assignment" card shows assigned technician, scheduled start (datetime), due date (date), pickup target (datetime), priority, optional estimated duration. Label: "Managed by operations." Receptionist/CEO can edit (hasPermission jobs.assign / jobs.edit_basic); technician view-only.

    ### Stage system
    - **Implementation:** `JOB_STAGES` in types: intake, inspection, prep, disassembly, installation, reassembly, inspection_final, media, ready. `STAGE_PROGRESS` map for %. `JobStageUpdate` for history. `src/lib/job-workflow/stage-transitions.ts`: ALLOWED_NEXT_STAGES (and rollback one step), canTransitionTo(role), stageRequiresPhoto(stage), STAGES_REQUIRING_PHOTO (inspection, prep, installation, inspection_final, ready).
    - **UI:** Job detail Progress card with stage select; technician restricted to allowed next/previous; receptionist/CEO can override. Required-photo check: if technician moves to a stage in STAGES_REQUIRING_PHOTO and job has no media, transition blocked with message; override by receptionist/CEO. Active Jobs kanban columns by stage; move job respects canTransitionTo and photo requirement.

    ### Status system
    - **Implementation:** `JobStatus`: active, blocked, on_hold, ready_for_pickup, completed, cancelled. Separate from stage. Status set via setJobStatus; blocked also set via setJobBlocker (which sets status to blocked and back to active on unblock). Config: JOB_STATUS_LABELS, RECEPTIONIST_SETTABLE_STATUSES (excludes blocked from dropdown; blocked set via blocker flow).
    - **UI:** Job detail "Operational status" card: status dropdown (receptionist when not blocked), block buttons (parts, approval, payment, material, rework) for roles with jobs.update_status. Blocker banner when isBlocked with unblock button.

    ### Permissions
    - **Implementation:** `src/lib/auth/role-permissions.ts` — CEO, Receptionist, Technician permission arrays. `hasPermission(role, permission)`. Permissions include customers.view/create/edit/delete, vehicles.view/create/edit, jobs.view_all/view_operational/view_assigned, jobs.create, jobs.edit_basic, jobs.assign, jobs.update_status, jobs.add_notes, jobs.upload_media, quotes.*, pipeline.*, calendar.view/edit, media.view/view_assigned/upload/manage, etc. Route access: `src/lib/auth/access.ts` — canAccessRoute(role, pathname), getScopeForRole (all / operational / assigned).
    - **UI:** usePermissions(), hasPermission() used in job detail, media, etc. to show/hide edit controls. Technician: no customers.delete, no jobs.assign, no jobs.edit_basic; has jobs.update_status (blocker), jobs.add_notes, jobs.upload_media, media.view_assigned.

    ### Technician workflow
    - **Implementation:** Technician sees scoped jobs (assigned only) via getScopedJobs. Dashboard: "My Jobs" (`/dashboard/my-jobs`) — assigned today, overdue, in progress, next due; links to job detail. Active Jobs page shows only assigned jobs for technician. Job detail: technician can update stage (within allowed transitions), add notes, upload media, set blocker; cannot edit scheduling, status (except block), customer, vehicle, service.
    - **UI:** Sidebar for technician: Dashboard (My Jobs), My Jobs (/jobs), Uploads (/media), Notifications, Chat. Full page nav via `<a>` to avoid chunk load issues.

    ### Receptionist workflow
    - **Implementation:** Receptionist has dashboard.view_operational, jobs.view_operational, customers.* (no delete), jobs.assign, jobs.edit_basic, calendar.view/edit. Dashboard: "Operational dashboard" — drop-offs/pickups today, pending quotes, new customers, jobs needing scheduling, technician workload. Can create customer, create job, assign technician, set scheduling fields, set status (not blocked via dropdown), manage quotes/pipeline, use calendar.
    - **UI:** Sidebar: Dashboard (operations), Customers, Active Jobs, Quote Requests, Pipeline, Calendar, Media, Services, Notifications, Chat. Add Customer does not create quote/pipeline/job; success offers next steps.

    ---

    ## SECTION 2 — FEATURE COMPLETION CHECKLIST

    | Feature | Status | Notes |
    |--------|--------|--------|
    | Customer management | ✓ Fully implemented | CRUD, list, detail, profile modal, delete with options |
    | Vehicle records | ✓ Fully implemented | First-class type and store; linked to customer and jobs; no Vehicle.notes |
    | Quote requests | ✓ Fully implemented | List, detail, new, convert to job |
    | Pipeline management | ✓ Fully implemented | Kanban, lead profile, stages |
    | Job management | ✓ Fully implemented | Create, list, detail, stage, status, scheduling |
    | Active jobs board | ✓ Fully implemented | Kanban + table, scoped by role, stage columns |
    | Job detail screen | ✓ Fully implemented | Customer, Vehicle, Service, Scheduling & Assignment, Status, Progress, Notes, Media, Activity log |
    | Technician "My Jobs" dashboard | ✓ Fully implemented | Assigned today, overdue, in progress, next due, links to jobs |
    | Scheduling block on job detail | ✓ Fully implemented | Technician, scheduled start, due, pickup target, priority |
    | Calendar (job-driven) | ✓ Fully implemented | drop_off, scheduled_start, due, pickup, pickup_target; summary cards; right panel |
    | Media upload system | ✓ Fully implemented | Job detail + media library; visibility internal/customer_visible |
    | Notes with visibility control | ✓ Fully implemented | jobNotes + legacy notes; Internal / Customer visible |
    | Timeline / activity log | ⚠ Partially implemented | Only "Job created" + stage updates; no status/note/media/assign/date change events |
    | Priority system | ✓ Fully implemented | low, standard, urgent, rush; config labels; used in job detail and calendar |
    | Blocker system | ✓ Fully implemented | isBlocked, blockerReason, blockedAt/By; predefined reasons; unblock |
    | Duplicate detection | ⚠ Partially implemented | Customer (phone/email) only; no vehicle (VIN/plate) or quote duplicate check |
    | Required-photo stages | ✓ Fully implemented | Config stages; enforced for technician; override for receptionist/CEO |
    | Role permission system | ✓ Fully implemented | Three roles; route and data scope; permission gates in UI |
    | Receptionist scheduling model | ✓ Fully implemented | All four controls in job detail; calendar uses same fields |
    | Calendar right panel (unscheduled, pickups, tech workload) | ✓ Fully implemented | Present and wired |
    | Stage transition rules | ✓ Fully implemented | Allowed next/previous; technician restricted; photo check |
    | Vehicle as first-class (vin, plate, trim, color) | ✓ Fully implemented | Type and mock have these |
    | Job field naming (scheduledStart vs scheduledStartDate) | ⚠ Naming variance | Vision: scheduledStart/pickupTarget; code: scheduledStartDate/pickupTargetTime |
    | Timeline events (comprehensive) | ✗ Not implemented | No timelineEvents[]; no auto-log for status, notes, media, assign, etc. |
    | Vehicle duplicate warning (VIN/plate) | ✗ Not implemented | Not in add-vehicle or create-job flow |
    | Quote duplicate warning | ✗ Not implemented | Not in create-quote flow |
    | Job detail access check (technician sees only assigned) | ⚠ Partially implemented | Job list scoped; job detail page does not redirect if technician opens another's job by URL |
    | Stage names vs vision (scheduled, qc_media, delivered) | ⚠ Naming variance | Vision: scheduled, qc_media, delivered; code: inspection, disassembly, reassembly, inspection_final, media, ready (no "delivered") |

    ---

    ## SECTION 3 — DATA MODEL REVIEW

    ### Job structure (ServiceJob)
    - **Present:** id, shopId, customerId, vehicleId, serviceId, assignedTechnicianId, stage, progress, status, priority, dueDate, dropOffDate, scheduledStartDate, pickupTargetTime, estimatedDurationMinutes, isBlocked, blockerReason, blockedAt, blockedBy, stageUpdates, jobNotes, notes, mediaIds, createdAt, updatedAt, completedAt.
    - **Missing / variance:** No dedicated `timelineEvents[]`; activity is derived from created + stageUpdates. Naming: vision uses scheduledStart/pickupTarget; code uses scheduledStartDate/pickupTargetTime (acceptable).
    - **Duplication:** Both `notes: string[]` and `jobNotes?: JobNote[]` maintained; addJobNote writes to both. jobNotes is preferred for display.

    ### Customer structure
    - **Present:** id, shopId, name, phone, email, notes, vehicleIds, totalSpend, createdAt, updatedAt.
    - **Assessment:** Aligned with vision; no missing fields.

    ### Vehicle structure
    - **Present:** id, shopId, customerId, make, model, year, trim, color, vin, plate, serviceJobIds, createdAt, updatedAt.
    - **Missing:** Optional `notes` (vision mentioned "notes optional").
    - **Assessment:** Otherwise first-class and consistent.

    ### Quote structure (QuoteRequest)
    - **Present:** Full set including customerId, vehicleId, customer/vehicle snapshots, serviceIds, status, source, convertedToJobId.
    - **Assessment:** Suitable for pre-job pipeline; no structural issues.

    ### Media structure (MediaAsset)
    - **Present:** id, shopId, jobId, customerId, vehicleId, type, url, thumbnailUrl, title, caption, visibility, uploadedBy, createdAt.
    - **Assessment:** Matches vision; job-linked and visibility supported.

    ### Notes structure (JobNote)
    - **Present:** id, text, visibility (internal | customer_visible), createdAt, createdBy.
    - **Assessment:** Correct; used via getJobNotesForDisplay with legacy fallback.

    ### Timeline structure
    - **Current:** No first-class timeline model. Activity log is computed from job.createdAt and job.stageUpdates only.
    - **Gap:** Vision expects events for customer/vehicle/quote created, job created, technician assigned, stage/status change, note added, media uploaded, priority/due/scheduled/pickup changes, blocker added/resolved. None of these are persisted or shown except stage updates and "Job created".

    ---

    ## SECTION 4 — WORKFLOW QUALITY REVIEW

    ### Receptionist workflow
    - **Correct:** Can create customer (only), then choose Add vehicle / Create quote / Create job. Can create job (new or existing client) with service, due date, technician, priority. Can assign technician, set scheduled start, due date, pickup target, priority, and status (active, on_hold, ready_for_pickup, completed, cancelled) on job detail. Can use calendar and unscheduled list. Cannot set "blocked" via status dropdown (must use Unblock when blocked). No customers.delete (CEO only).
    - **Gaps:** Receptionist dashboard "drop-offs today" uses dueDate, not dropOffDate/scheduledStartDate; could be clarified for planning.

    ### Technician workflow
    - **Correct:** Sees only assigned jobs (list and dashboard). Can open job, move stage within allowed transitions, add notes (with visibility), upload media (with visibility), set blocker with reason. Cannot edit customer, vehicle, service, scheduling, or status (except block). Required-photo check before moving to configured stages; can be overridden by receptionist/CEO.
    - **Gaps:** Job detail route does not enforce canAccessJob; technician could open /jobs/[id] for another's job and see read-only view (data leak / confusion).

    ### Scheduling flow
    - **Correct:** All four levers (assign technician, scheduled start, due date, pickup target) exist on job and in Job detail Scheduling card. Create-job can set due date and optional technician. Calendar derives events from these fields; unscheduled = intake or missing technician or missing scheduledStartDate.

    ### Stage progression
    - **Correct:** ALLOWED_NEXT_STAGES and rollback one step; technician restricted; receptionist/CEO override. stageRequiresPhoto blocks technician until media exists or override. Stage updates appended to job and shown in activity log.

    ### Blocker handling
    - **Correct:** setJobBlocker updates isBlocked, blockerReason, blockedAt, blockedBy and syncs status to/from "blocked". Predefined reasons in config. Unblock available to roles with edit_basic or update_status. Blocked jobs appear in calendar and job detail.

    ### Job lifecycle
    - **Correct:** Create job → intake; assign and schedule; technician advances stage; status can move to ready_for_pickup, completed, cancelled. completedAt exists. No explicit "delivered" stage; "ready" is the final stage in code.

    ### Customer → Vehicle → Job relationship
    - **Correct:** Customer has vehicleIds; Vehicle has customerId and serviceJobIds; Job has customerId and vehicleId. Create-job and stores maintain consistency (addVehicleToCustomer, addJobToVehicle). No orphan jobs in model.

    ---

    ## SECTION 5 — ROLE PERMISSION REVIEW

    ### Receptionist abilities
    - **Granted:** dashboard.view_operational, customers.view/create/edit, vehicles.view/create/edit, jobs.view_operational, jobs.create, jobs.edit_basic, jobs.assign, quotes.*, pipeline.view/edit, calendar.view/edit, media.view/upload, services.view, notifications, chat. Can set status (non-blocked), priority, scheduling, assign tech; can override stage and required-photo.
    - **Not granted:** customers.delete (CEO only), jobs.view_all (CEO only), media.manage, team, settings, analytics, invoices. Correct for vision.

    ### Technician abilities
    - **Granted:** dashboard.view_personal, jobs.view_assigned, jobs.update_status, jobs.add_notes, jobs.upload_media, media.view_assigned, media.upload, notifications, chat. Can move stage (within rules), add notes, upload media, set/unset blocker.
    - **Not granted:** customers, vehicles (no list access), jobs.assign, jobs.edit_basic, quotes, pipeline, calendar.edit, media.view (all). getScopedCustomers returns [] for technician; getScopedJobs returns only assigned; getScopedMedia returns assigned-job + own uploads. Correct.
    - **Loophole:** Job detail page does not call canAccessJob; technician can navigate to /jobs/[other-job-id] and see that job (read-only). Should redirect or 404 for non-assigned job when role is technician.

    ### CEO abilities
    - **Granted:** Full permissions including customers.delete, jobs.view_all, media.manage, team.manage, settings, analytics, invoices, etc. Can override stage and required-photo, unblock, edit scheduling and status. Correct.

    ---

    ## SECTION 6 — CALENDAR QUALITY REVIEW

    - **Job-driven:** Yes. All events come from buildCalendarEvents(jobs, ...). No freeform events.
    - **scheduledStartDate and pickupTargetTime:** Integrated. Events: drop_off (dropOffDate ?? scheduledStartDate ?? createdAt), scheduled_start (when different from drop), due (dueDate), pickup (when stage ready or completedAt), pickup_target (when pickupTargetTime set and job not ready).
    - **Unscheduled jobs:** Defined as intake OR !assignedTechnicianId OR !scheduledStartDate; listed in right panel with "Open job" / "Schedule" (link to job).
    - **Receptionist planning:** Summary cards (drop-offs/due/pickups today, unscheduled count, blocked/at risk), filters (technician, service, status), main grid, unscheduled list, upcoming pickups, technician workload. Event cards link to job. Supports planning; no in-calendar quick-schedule (user goes to job detail).

    ---

    ## SECTION 7 — ARCHITECTURE QUALITY

    - **Code organization:** Clear split: app (routes), components (UI), stores (Zustand), lib (auth, calendar, job-workflow, data-scope, utils, validations, duplicate-warnings, job-notes), types, data (mock). No obvious duplication of feature logic.
    - **Type safety:** Strong TypeScript; shared types in types/index.ts; JobStage, JobStatus, JobPriority, etc. used consistently. Some extended job shapes (e.g. jobs-table) use priority?: string; isStandardPriority(priority) accepts string for flexibility.
    - **Config centralization:** job-workflow/config.ts (status/priority labels, RECEPTIONIST_SETTABLE_STATUSES, BLOCKER_REASON_OPTIONS, VISIBILITY_OPTIONS, REQUIRED_PHOTO_STAGE_MESSAGE, EARLY_STAGES, isStandardPriority). stage-transitions.ts (ALLOWED_NEXT_STAGES, STAGES_REQUIRING_PHOTO, canTransitionTo, stageRequiresPhoto). CALENDAR_EVENT_TYPE_LABELS in job-events. Single source for labels and rules.
    - **Stage/status definitions:** Types define stages and statuses; config holds labels and settable statuses; transitions in dedicated module. Separation of stage vs status is clear in code and UI.
    - **Helper utilities:** formatDate, formatDateTime, formatJobStage in utils; getJobNotesForDisplay in job-notes; checkDuplicateCustomer in duplicate-warnings; getScopedJobs, canAccessJob, getScopedMedia in data-scope. Reused appropriately.
    - **Reusable components:** UI primitives (Button, Card, Select, etc.); job-detail-view receives data and uses permissions for visibility. Modals (add-customer, create-job, create-quote, etc.) are self-contained.
    - **State management:** Zustand stores (auth, jobs, customers, vehicles, quotes, pipeline, media, services, team, notifications, ui). No global timeline store; timeline is derived from job. Auth persisted with safe storage and rehydration.
    - **Weaknesses:** (1) Job detail page does not enforce canAccessJob for technician. (2) Timeline has no first-class model—extending to full event set would require a new structure and store or job-level events array. (3) Dual notes (notes[] and jobNotes[]) kept in sync only on write; display prefers jobNotes. (4) Receptionist dashboard uses dueDate for "drop-offs today" instead of dropOffDate/scheduledStartDate.

    ---

    ## SECTION 8 — UX / PRODUCT QUALITY

    - **Intuitive:** Role-based sidebar and dashboard reduce clutter. Job detail sections (Customer, Vehicle, Service, Scheduling & Assignment, Operational status, Progress, Notes, Media, Activity log) are labeled; "Managed by operations" and "Updated by technician workflow" set expectations. Priority and blocker are visible in header and cards.
    - **Workflows:** Receptionist: add customer → optional vehicle/quote/job; create job from modal; schedule from job detail or calendar (link to job). Technician: My Jobs → job → stage, notes, media, blocker. Flows are coherent; no dead ends found.
    - **Job detail clarity:** Two-column layout (left: customer/vehicle/service/scheduling/status; right: progress, stage timeline, notes, media, activity). Scheduling and status are grouped; blocker has prominent banner. Notes and media show visibility.
    - **Scheduling ease:** Single card with all scheduling fields; datetime and date inputs; receptionist can edit, technician view-only. No inline calendar picker on job detail; user uses main Calendar to see context.
    - **Technician speed:** My Jobs dashboard and Active Jobs show assigned work; one click to job detail; stage dropdown and block buttons are immediate. Photo requirement can slow transition until media added or override used—acceptable.

    ---

    ## SECTION 9 — CRITICAL ISSUES

    1. **Job detail access control:** Technician can open any job by URL (`/jobs/[id]`). Page does not check canAccessJob; technician sees another technician's job (read-only but still a data/UX issue). Should redirect or show "not found" when !canAccessJob(role, userId, job).

    2. **Timeline is not comprehensive:** Activity log only shows "Job created" and stage updates. Status changes, note added, media uploaded, technician assigned, due/scheduled/pickup/priority changes, and blocker add/resolve are not logged. Vision expects a full timeline; current implementation is a subset.

    3. **No first-class timeline model:** Extending the timeline would require either a new `timelineEvents[]` (or similar) on the job and store actions that append events, or a separate timeline store. Today there is no event type enum or payload shape for these events.

    4. **Vehicle.notes missing:** Vision lists "notes optional" for vehicle; type and store do not have it. Low impact but a small gap.

    5. **Duplicate detection incomplete:** Only customer (phone/email) is checked. Vehicle (VIN, plate) and quote (e.g. same customer/vehicle/service) have no duplicate warning in create flows.

    6. **Stage naming vs vision:** Vision uses "scheduled", "qc_media", "delivered". Code uses "inspection", "disassembly", "reassembly", "inspection_final", "media", "ready". No "scheduled" or "delivered" stage. Functional behavior is present but naming differs; may confuse product/docs alignment.

    7. **Receptionist dashboard "drop-offs today":** Uses jobs where dueDate is today; vision might expect dropOffDate or scheduledStartDate for "vehicles coming in today". Minor semantic mismatch.

    ---

    ## SECTION 10 — NEXT DEVELOPMENT PRIORITIES

    1. **Enforce job access on job detail (technician):** In `/jobs/[id]` or in a wrapper, if role is technician and !canAccessJob(role, userId, job), redirect to /jobs or show "You don't have access to this job". Prevents technicians from viewing others' jobs by URL.

    2. **Introduce a proper timeline model and logging:** Define a `JobTimelineEvent` type (e.g. kind, payload, createdAt, createdBy) and optionally `job.timelineEvents[]` or a small store. Emit events when: job created, technician assigned, stage changed, status changed, note added, media uploaded, priority/due/scheduled/pickup changed, blocker set/cleared. Update activity log UI to consume this list. Enables full audit trail and matches vision.

    3. **Add vehicle duplicate warning:** In add-vehicle or create-job (when adding vehicle), call a small helper (e.g. checkDuplicateVehicle(vehicles, { vin?, plate? })) and show "Possible duplicate (VIN/plate)" with "Use existing" / "Create anyway".

    4. **Add quote duplicate warning (optional):** When creating a quote, check for existing quote for same customer/vehicle/service (or similar) and surface "Possible duplicate" with use existing / create anyway.

    5. **Add Vehicle.notes:** Add optional `notes?: string` to Vehicle type and to add/edit vehicle UI if present. Low effort, aligns with vision.

    6. **Receptionist dashboard "drop-offs today":** Base on dropOffDate or scheduledStartDate (and optionally dueDate) so "drop-offs today" means vehicles expected in today, not due today. Aligns with calendar semantics.

    7. **Consider stage naming alignment:** If product/docs must match vision terms (scheduled, qc_media, delivered), plan a staged rename or mapping layer; otherwise document current stage set as the canonical one and update vision to match code.

    8. **Deprecate legacy notes[] fully:** Once timeline and jobNotes are sufficient, stop writing to `notes[]` in addJobNote and migrate remaining readers to getJobNotesForDisplay only; eventually remove notes from type or mark deprecated in type only.

    ---

    *End of audit. No code was modified; this document is analysis and recommendation only.*
