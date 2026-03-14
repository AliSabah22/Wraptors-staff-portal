# Receptionist workflow — Wraptors Inc. staff portal

This document describes the **receptionist view** workflow for the bodyshop staff portal: from customer creation through intake to scheduling. It is used to tighten the UX and keep the flow optimal for daily operations.

---

## What happens when a customer is created

When a receptionist adds a customer via **Add customer** (Quick Create or Customers page):

1. **Customer** is created and added to the customer list.
2. **Quote request** is created (status `new`) so the customer appears on the Quote Requests tab.
3. **Pipeline lead** is created (stage `lead`) for sales tracking.
4. **Placeholder vehicle** is created (`make: "New", model: "—"`) and linked to the customer.
5. **Service job** is created in **intake** (`stage: "intake"`), linked to that vehicle and a default service (`svc_1`). Optionally an **assigned technician** can be set in the modal.
6. **Job** is linked to the vehicle via `addJobToVehicle`.

So **every new customer automatically gets one intake job**. The next step for the receptionist is to **schedule** that job: assign a technician, set/confirm due date, and move it through the shop stages.

---

## Current receptionist workflow (step-by-step)

| Step | Where | Action | Result / issue |
|------|--------|--------|------------------|
| 1 | Top bar or Customers page | **Add customer** (modal) | Customer + quote + lead + vehicle + **intake job** created. |
| 2 | Add customer success | **Done** or **View customer** | Modal closes or user goes to customer profile. **Gap:** No direct path to the new intake job. |
| 3 | Dashboard (operational) | Receptionist sees **Jobs needing scheduling** | List shows intake jobs as "Job {id.slice(-4)}" and due date only. No customer or vehicle context. |
| 4 | Jobs needing scheduling | Click **Schedule** | Navigates to job detail `/jobs/[id]`. |
| 5 | Job detail | Assign technician, change stage, add notes | Scheduling is done here. Back link goes to `/jobs`. |

**Friction points:**

- After **Add customer**, the natural next step is “schedule this job,” but the success screen only offers **View customer**. Receptionist must remember the job exists and find it on dashboard or Active Jobs.
- **Jobs needing scheduling** list shows a weak label (`Job xyz`), no customer/vehicle, no due-date order, vague CTA, and a bare empty state with no next action.
- No “View all in Active Jobs” from the dashboard card when there are more than 8 intake jobs.

---

## Intended optimal flow (after improvements)

1. **Add customer** → Success screen offers **Open job & schedule** (primary) and **View customer** / **Done**. One click to the new intake job.
2. **Dashboard** → “Jobs needing scheduling” shows **customer name** (primary), **vehicle · due date** (secondary), sorted by **due date (soonest first)**. CTA: **Open & schedule** (same as today: link to job detail). Footer: **View all in Active Jobs** when useful.
3. **Empty state** → “No jobs in intake. New jobs appear when you add a customer or create a job from a quote.” + **Add customer** button (or link to customers) so the next action is obvious.
4. **Job detail** → Unchanged: assign technician, set stage, add notes. Remains the single place where scheduling is done.

---

## Data flow (receptionist dashboard)

- **Jobs needing scheduling** = `jobs` where `stage === "intake"` and `!completedAt`, **sorted by `dueDate` ascending**.
- For each job, resolve **customer name** (`useCustomersStore`), **vehicle label** (`useVehiclesStore.getVehicleById` → e.g. `Make Model (Year)`), and optionally **service name** (`useServicesStore`) for display only.
- Card copy: “Intake jobs not yet assigned or scheduled. Open a job to assign a technician and set the schedule.”
- Button label: **Open & schedule** (or keep “Schedule”) to signal that the next screen is where scheduling happens.

---

## Files involved

| Area | File |
|------|------|
| Receptionist dashboard | `src/components/dashboard/receptionist-dashboard.tsx` |
| Add customer (success + job link) | `src/components/customers/add-customer-modal.tsx` |
| Job detail (scheduling) | `src/components/jobs/job-detail-view.tsx`, `src/app/jobs/[id]/page.tsx` |
| Jobs list / kanban | `src/app/jobs/page.tsx`, `src/components/jobs/jobs-kanban.tsx` |
| Stores | `src/stores/jobs.ts`, `customers.ts`, `vehicles.ts`, `services.ts` |

---

## Out of scope (for later)

- Inline “Assign technician” on the dashboard (would need more state and store updates; link to detail is sufficient for now).
- Dedicated “scheduling” modal (e.g. pick date + technician) before opening the job; can be a follow-up for a one-click schedule from the dashboard.
