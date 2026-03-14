# Wraptors Staff Portal — Comprehensive Audit Report

**Date:** March 2025  
**Scope:** Codebase scan, integration check, and hardening (no new features).  
**Stack:** Next.js 15, React 19, Zustand, mock data (no database or API routes).

---

## Executive Summary

The portal is a **client-only application** with Zustand stores and localStorage persistence. There are **no API routes**, **no server actions**, and **no database** — all data lives in mock files and persisted store state. The audit focused on: (1) dependency and code quality, (2) data model consistency, (3) frontend integration and role-based access, (4) critical workflow behavior, (5) error handling and resilience, and (6) security and maintainability within this architecture.

**Critical issues fixed in this audit:**

- **Job detail access control:** Technicians could open any job by URL; now they are redirected to `/jobs` when accessing a job not assigned to them.
- **Receptionist “Drop-offs today”:** Previously used `dueDate`; now uses `dropOffDate ?? scheduledStartDate` (vehicles expected in today), aligned with calendar semantics.
- **Create job double-submit:** “Create job (Intake)” button could be clicked twice; now disabled with “Creating…” state during submit.
- **Blocker notifications:** Hardcoded `SHOP_ID` replaced with import from `@/lib/constants`.
- **Media upload attribution:** Upload modal now uses current user for `uploadedBy` instead of hardcoded `staff_1`.

---

## Phase 1 — Codebase Scan & Dependency Audit

### Modules, Components, Services, Hooks, Utilities, Types

| Category | Path / Files |
|----------|---------------|
| **Types** | `src/types/index.ts` (Job, Customer, Vehicle, Quote, Pipeline, Media, Chat, Notification, Service, etc.) |
| **Stores** | `src/stores/*.ts` — auth, jobs, customers, vehicles, quotes, pipeline, media, services, team, notifications, ui, chat, meta-integration; re-exported from `stores/index.ts` |
| **Hooks** | `useCurrentUser`, `usePermissions`, `useJobsForTracking`, `useRehydrateJobsOnFocus` |
| **Lib** | `lib/auth` (access, role-permissions, permissions, roles, session), `lib/calendar/job-events.ts`, `lib/chat/*`, `lib/data-scope`, `lib/duplicate-warnings`, `lib/job-notes`, `lib/job-workflow` (config, stage-transitions, blocker-copy, blocker-notifications), `lib/integrations/meta-leads`, `lib/navigation/sidebar`, `lib/validations`, `lib/utils`, `lib/constants`, `lib/date-range` |
| **Data** | `data/mock.ts`, `data/auth-mock.ts`, `data/chat-mock.ts`, `data/meta-leads-mock.ts` |
| **Config** | `config/nav.ts` |
| **App routes** | `app/layout.tsx`, `app/page.tsx`, `app/login`, `app/dashboard/*`, `app/jobs/*`, `app/customers/*`, `app/quote-requests/*`, `app/pipeline`, `app/calendar`, `app/media`, `app/chat`, `app/notifications`, `app/team`, `app/settings`, `app/analytics`, `app/invoices`, `app/services`, `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` |
| **Components** | `components/ui/*`, `components/layout/*`, `components/auth/*`, `components/jobs/*`, `components/customers/*`, `components/pipeline/*`, `components/chat/*`, `components/dashboard/*`, `components/media/*`, `components/analytics/*`, `components/settings/*`, `components/team/*`, `components/error-boundary.tsx`, `components/chunk-load-error-handler.tsx` |

### Dependency Map (High Level)

- **Stores** depend on `@/types`, `@/data/mock` (or other data), and sometimes each other (e.g. pipeline uses quotes store via `getState()`).
- **Pages** depend on stores, hooks, components, and lib (auth, data-scope, job-workflow, calendar).
- **Lib** modules depend on `@/types` and each other (e.g. data-scope uses auth/access and auth/role-permissions).
- **No circular dependency** found: stores → types/data; lib → types + auth; components → stores + lib + hooks.

### Findings

| Finding | Severity | Status |
|--------|----------|--------|
| Imports use `@/` alias consistently; no deep relative paths (`../../../`) | — | OK |
| No unused imports or dead code detected at scan level | — | OK |
| No `process.env` or `.env` usage (app is mock-only) | Low | Documented; `.env.example` added for future backend |
| No API base URLs (no API layer) | — | N/A |
| Hardcoded `SHOP_ID` in `blocker-notifications.ts` | Low | **Fixed** — now uses `@/lib/constants` |
| Job detail page did not enforce `canAccessJob` for technician | **Critical** | **Fixed** — redirect + no render when no access |
| Receptionist “Drop-offs today” used `dueDate` instead of drop-off date | Medium | **Fixed** — uses dropOffDate/scheduledStartDate |
| Create job submit button not disabled during submit | Medium | **Fixed** — `isCreating` state and disabled + label |
| Media upload modal used hardcoded `uploadedBy` | Low | **Fixed** — uses `useCurrentUser().user?.id` |

---

## Phase 2 — Database & Data Model Integrity

**Context:** There is no database. Data is in-memory (Zustand) with optional localStorage persistence for auth and jobs.

### Checks Performed

- **Types vs usage:** Types in `src/types/index.ts` are used consistently across stores and components. Job has both `notes: string[]` and `jobNotes?: JobNote[]`; addJobNote writes to both (documented in existing audit).
- **Relationships:** Customer → vehicleIds; Vehicle → customerId, serviceJobIds; Job → customerId, vehicleId, serviceId, assignedTechnicianId, mediaIds; stores keep these in sync (addVehicleToCustomer, addJobToVehicle, addMediaToJob).
- **Enums:** JobStage, JobStatus, JobPriority, PipelineStage, etc. are defined in types and used via config (e.g. `lib/job-workflow/config.ts`, `stage-transitions.ts`). No enum mismatch found.
- **Defaults:** Job `status` and `priority` are optional in type; config and UI treat them as “active” and “standard” when absent. No schema to migrate.

**No database migrations or indexes** — not applicable. When moving to a real DB, the existing audit (PRODUCT_CODEBASE_AUDIT.md) recommends indexes on jobs (status, stage, assigned_technician_id, due_date), pipeline_leads (stage, source), notifications (user_id, read), media (job_id), chat (thread_id, created_at), and proper cascades on job delete.

---

## Phase 3 — API Layer Audit

**Context:** No API routes or server actions. All mutations go through Zustand store actions.

- **Authentication / authorization:** Handled in the client (auth store, route access via `canAccessRoute`, data scope via `getScopedJobs`, `canAccessJob`, `getScopedMedia`). Job detail now enforces `canAccessJob` for technicians.
- **Input validation:** Forms use Zod (e.g. `lib/validations.ts`) and react-hook-form with resolvers. Store actions assume validated input from UI.
- **Error handling:** Store updates are synchronous; no try/catch around store calls. Login (auth-mock) returns `{ ok: false, error }` on failure. No stack traces exposed.
- **Pagination:** Lists (jobs, customers, notifications, etc.) are in-memory; no pagination. Acceptable for current demo scale; for production, list endpoints would need pagination and date-range filters.

**No N+1 or backend pagination** — N/A until a backend exists.

---

## Phase 4 — Frontend Integration Audit

| Check | Result |
|-------|--------|
| Loading / error / empty states | Jobs list, dashboard, and main pages use store state; “Job not found” and empty lists are handled. No network errors (no API). |
| Optimistic updates | Store updates are immediate; no rollback pattern (no API). |
| Form submit button disabled | Add customer, create quote, lead profile, upload media, add service, customer profile edit: use `disabled={isSubmitting}`. Create job (Intake): **fixed** with `isCreating`. |
| Real-time / subscriptions | No WebSocket/SSE. Zustand persistence and rehydration (e.g. useRehydrateJobsOnFocus, useJobsForTracking) keep state in sync across tabs; no subscription leak. |
| Role-based UI | PermissionGate and hasPermission used in job detail, media, etc. CEO-only actions (approve/deny) gated; technician cannot access unassigned job detail (**fixed**). |
| Job stage update flow | updateJobStage in store; UI subscribes to store; other users see updates on next load or tab focus (no real-time server). |
| Notification bell | Unread count from store; markAsRead/markAllAsRead on open; no excessive re-fetch (no API). |
| Calendar | buildCalendarEvents uses dropOffDate, scheduledStartDate, dueDate, pickupTargetTime; receptionist “Drop-offs today” aligned with same semantics (**fixed**). |
| Media upload | Progress/state in modal; addMedia + addMediaToJob; **fixed** to use current user for uploadedBy. |
| Chat | Messages from store; order by createdAt; addMessage appends; unread per thread in chat store. |

---

## Phase 5 — Cross-Module Workflow Integration

Traced in code only (no live DB/API):

1. **Lead → Job:** Pipeline lead (store) → updateLeadStage; lead profile modal edits lead. There is **no “convert lead to customer”** flow in code (no atomic customer + vehicle creation from lead). Create job modal can create new customer + vehicle + job in one flow. **Gap:** Pipeline “convert to customer” is not implemented; documented as remaining risk.
2. **Job execution:** Stage updates (updateJobStage), media (addMedia + addMediaToJob), notes (addJobNote), blocker (createBlockRequest) are wired. Stage transition rules and photo requirement in stage-transitions.ts; job detail uses them.
3. **Blocker & approval:** createBlockRequest / resolveBlockRequest / approveApprovalRequest / denyApprovalRequest in jobs store; job-detail-view calls them and uses blocker-notifications to addNotification; CEO sees approval and can approve/deny.
4. **Scheduling:** assignTechnician, setScheduledStartDate, setDueDate, setPickupTargetTime, setDropOffDate in store; calendar and receptionist dashboard use same job fields. No conflict detection (e.g. technician capacity) — documented as future enhancement.
5. **Pickup:** Status “ready_for_pickup” and stage “ready”; completedAt set when completed. No SMS/email integration; “customer notification” and “pickup count” are product expectations for a future backend.

---

## Phase 6 — Real-Time & Async Reliability

- **WebSocket/SSE/polling:** Not implemented. No connection cleanup or reconnection to audit.
- **Notifications:** In-memory store; addNotification used from blocker-notifications and job-detail-view. No push or queue.
- **Meta webhook:** Meta integration is demo/mock; no webhook signature validation in code. Documented as remaining risk when going live.

---

## Phase 7 — Error Handling & Resilience

- **Error boundaries:** Root layout uses `RootErrorBoundary`; route-level `error.tsx` and `app/global-error.tsx` exist. ChunkLoadError triggers reload (error-boundary + ChunkLoadErrorHandler). No white-screen from unhandled React errors.
- **console.error:** Used in error-boundary and error.tsx for logging; acceptable.
- **Silent catch:** No empty catch blocks found; catch blocks either handle or rethrow.
- **Timeouts / file uploads:** No network or file upload to server; no timeout or partial-upload handling. When adding real uploads, add server-side validation and timeouts.
- **Database connection:** N/A.

---

## Phase 8 — Performance & Scalability

- **Full table scans:** All data in memory; no DB queries. For production, list endpoints must use date-range filters and pagination (see PRODUCT_CODEBASE_AUDIT.md).
- **Media storage:** Media URLs are in-memory (e.g. object URLs or mock URLs). Production should use object storage (e.g. S3) and not serve from app server.
- **Dashboard widgets:** Receptionist dashboard uses useMemo and store selectors; no full-table scan in DB sense. Calendar uses buildCalendarEvents over in-memory jobs.
- **Pagination:** Not implemented; all lists are in-memory. Recommended: when adding API, cap list responses and use cursor/offset.

---

## Phase 9 — Security Hardening

- **Session/JWT:** Auth is client-only (Zustand + localStorage). No server-side session validation. For production, every protected route/API must verify session server-side.
- **File uploads:** No server upload yet; client only sets type from file. Production must validate MIME type and size server-side.
- **CEO-only actions:** Approve/deny and escalation are gated by hasPermission in UI; there is no server to enforce role. When adding API, enforce role on server for admin/CEO actions.
- **PII logging:** No application logging of PII found in code.
- **API keys:** No Meta/Shopify/Twilio/Google keys in code; when used, they must be in env vars.
- **SQL injection:** No raw SQL; N/A.

---

## Phase 10 — Code Quality & Maintainability

- **Naming:** camelCase (TS/JS), PascalCase (components), SCREAMING_SNAKE for constants (e.g. SHOP_ID, JOB_STAGES). Consistent.
- **Magic strings:** Job stages/statuses and blocker types live in types and config; reused across app. SHOP_ID in constants; blocker-notifications now uses it.
- **Comments:** Major functions and configs have brief comments; could add one-liners to more store actions.
- **.env:** No env usage yet; `.env.example` added for future (e.g. API URL, keys).
- **console.log:** None in production paths.

---

## Deliverables

### 1. Audit Summary (by severity)

**Critical**

- ~~Technician could open any job by URL~~ → **Fixed:** job detail enforces `canAccessJob`, redirects and does not render content.

**High**

- None.

**Medium**

- ~~Receptionist “Drop-offs today” used dueDate~~ → **Fixed:** uses dropOffDate/scheduledStartDate.
- ~~Create job button could double-submit~~ → **Fixed:** disabled + “Creating…” while submitting.

**Low**

- ~~Hardcoded SHOP_ID in blocker-notifications~~ → **Fixed:** use `@/lib/constants`.
- ~~Media upload modal hardcoded uploadedBy~~ → **Fixed:** use current user.

### 2. Changes Made

| File | Change |
|------|--------|
| `src/app/jobs/[id]/page.tsx` | Import canAccessJob, useCurrentUser; useEffect to redirect technician when !canAccessJob; mayAccessJob guard to avoid rendering job content before redirect. |
| `src/lib/job-workflow/blocker-notifications.ts` | Replace hardcoded SHOP_ID with import from `@/lib/constants`. |
| `src/components/dashboard/receptionist-dashboard.tsx` | “Drop-offs today” now uses dropOffDate ?? scheduledStartDate ?? createdAt (date part) === today. |
| `src/components/jobs/create-job-modal.tsx` | Add isCreating state; set true at start of createJob, reset in resetAll; “Create job (Intake)” button disabled when isCreating, label “Creating…” while submitting. |
| `src/components/media/upload-media-modal.tsx` | Import useCurrentUser; set uploadedBy to user?.id ?? "staff_1". |
| `docs/AUDIT_REPORT.md` | This audit report. |
| `.env.example` | Added for future backend (optional keys). |

### 3. Remaining Risks

- **No backend:** All data is client/mock. Moving to production requires API, DB, and server-side auth and authorization.
- **Pipeline “convert to customer”:** Not implemented; lead → customer + vehicle is not atomic in the pipeline flow.
- **Technician capacity / conflict detection:** Not implemented when scheduling.
- **Real-time updates:** No WebSocket/SSE; multi-user updates only on refresh or tab focus.
- **Meta/webhook validation:** When adding real Meta Lead Ads webhook, validate signature before processing.
- **File upload:** No server-side MIME/size checks until an upload API exists.

### 4. Recommended Next Steps

1. **Backend and auth:** Introduce API routes or a separate backend, with session/JWT validation and role checks on every protected endpoint.
2. **Enforce role on server:** For CEO-only and sensitive actions, verify role server-side; do not rely only on hiding UI.
3. **Pagination and date filters:** For jobs, notifications, chat, and media lists, add pagination and date-range filters before scaling.
4. **Timeline model:** Add a first-class timeline/activity model (or event list on job) and log status changes, notes, media, assignments, and blocker events for a full audit trail (see PRODUCT_CODEBASE_AUDIT.md).
5. **Pipeline convert:** Implement “Convert to customer” from pipeline lead with atomic customer + vehicle creation and optional quote/job creation.

---

*End of audit report. All fixes are in code; remaining items are documented for follow-up.*
