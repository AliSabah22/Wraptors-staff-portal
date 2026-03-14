# Wraptors Staff Portal

Production-quality MVP of the **Wraptors Staff Portal** — the internal operating system for the Wraptors wrap shop. This portal powers backend operations and is designed so that when technicians update job stages here, the customer mobile app can reflect those changes.

## Tech stack

- **Next.js 15** (App Router)
- **TypeScript**
- **TailwindCSS** (Wraptors theme: black/gold)
- **Zustand** (state)
- **React Hook Form + Zod** (forms/validation)
- **Lucide** icons
- **Recharts** (analytics)
- **Framer Motion** (micro-interactions)
- **Radix UI** primitives (Dialog, Select, Tabs, etc.)

## Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If `npm run dev` says "Run npm install first", install dependencies and try again. If port 3000 is in use, run:

```bash
PORT=3001 npm run dev
```

Build for production:

```bash
npm run build
npm start
```

---

## Project structure

```
src/
├── app/                          # App Router pages
│   ├── layout.tsx                # Root layout (font, AppLayout)
│   ├── page.tsx                  # Dashboard
│   ├── globals.css               # Global styles, Wraptors theme
│   ├── jobs/
│   │   ├── page.tsx              # Active Jobs (Kanban / Table)
│   │   └── [id]/page.tsx         # Job detail
│   ├── customers/
│   │   ├── page.tsx              # Customers list
│   │   ├── [id]/page.tsx         # Customer profile
│   │   └── new/page.tsx          # New customer (placeholder)
│   ├── quote-requests/
│   │   ├── page.tsx              # Quote requests list
│   │   ├── [id]/page.tsx         # Quote detail
│   │   └── new/page.tsx          # New quote (placeholder)
│   ├── pipeline/page.tsx         # Sales pipeline Kanban
│   ├── calendar/page.tsx         # Scheduling calendar
│   ├── media/page.tsx            # Media library
│   ├── services/page.tsx         # Services catalog
│   ├── invoices/page.tsx         # Invoices
│   ├── analytics/page.tsx        # Analytics dashboard
│   ├── team/page.tsx             # Team / employees
│   ├── notifications/page.tsx    # Notifications
│   └── settings/page.tsx         # Settings
├── components/
│   ├── layout/
│   │   ├── app-layout.tsx        # Shell (sidebar + main)
│   │   ├── app-sidebar.tsx       # Left nav
│   │   └── top-bar.tsx           # Search, Quick Create, Notifications, User
│   ├── dashboard/
│   │   └── dashboard-page.tsx    # Dashboard widgets and charts
│   ├── jobs/
│   │   ├── jobs-kanban.tsx       # Kanban board for jobs
│   │   ├── jobs-table.tsx        # Table view for jobs
│   │   └── job-detail-view.tsx   # Job detail (stages, notes, media, activity)
│   └── ui/                       # Reusable UI (Button, Card, Input, etc.)
├── config/
│   └── nav.ts                    # Sidebar navigation config
├── data/
│   └── mock.ts                  # Seed mock data (customers, jobs, quotes, etc.)
├── lib/
│   ├── utils.ts                 # cn, formatCurrency, formatDate
│   └── validations.ts           # Zod schemas (customer, vehicle, job note)
├── stores/                      # Zustand stores
│   ├── index.ts
│   ├── jobs.ts
│   ├── customers.ts
│   ├── quotes.ts
│   ├── pipeline.ts
│   ├── notifications.ts
│   └── ui.ts
└── types/
    └── index.ts                 # TS models (Customer, Vehicle, ServiceJob, etc.)
```

---

## Mock vs production

### Current (MVP – mock)

- **Data**: All data comes from `src/data/mock.ts` and is loaded into Zustand stores on the client. No database or API calls.
- **Persistence**: Changes (e.g. job stage updates, notes) only persist in memory and are lost on refresh.
- **Auth**: No login; a single “current user” is assumed in the top bar.
- **Media**: Media library and job media show placeholders; no real file upload or storage.
- **Calendar**: Events are derived from mock jobs (drop-off, due, pickup); no real scheduling backend.
- **New customer / New quote**: Placeholder pages only; no forms wired to stores or API.

### Production-ready path

- **Database**: Replace mock data with **Supabase** (or another backend). Keep the same TypeScript types in `src/types/index.ts` and the same store shapes; swap store implementations to call Supabase client (e.g. `getJobs()`, `updateJobStage()`).
- **Real-time**: Use Supabase Realtime (or similar) so job updates in the staff portal are pushed to the mobile app.
- **Auth**: Add Supabase Auth (or your auth provider); protect routes and pass user/role into stores and UI for RBAC.
- **Media**: Use Supabase Storage (or S3) for job photos/videos; store URLs in `MediaAsset` and link to jobs/customers.
- **Multi-tenant**: Entities already include `shopId`; scope all queries and mutations by `shopId` once you have a “current shop” (e.g. from session or workspace selector).

---

## Features included

| Area | What’s included |
|------|------------------|
| **Dashboard** | KPIs (active jobs, due today, pending quotes, revenue, avg job value, conversion), revenue trend chart, job status pie, recent activity, technician workload, quick actions |
| **Active Jobs** | Kanban and table views; job cards with customer, vehicle, service, progress, due date; link to job detail |
| **Job detail** | Customer/vehicle/service/technician, progress bar, stage selector, stage timeline, notes, media placeholders, activity log |
| **Customers** | List and detail (contact, vehicles, service history) |
| **Quote requests** | List with status/source/amount; detail view |
| **Pipeline** | Kanban by lead stage (lead → consultation → quote sent → follow-up → booked / lost) |
| **Calendar** | Week view with events from jobs |
| **Media library** | Grid of mock media by job |
| **Services** | List of services with description and estimated price |
| **Invoices** | Table of invoices (customer, job, amount, status, due) |
| **Analytics** | Revenue and jobs-completed bar charts; quote conversion line chart |
| **Team** | Employee cards with role and (for technicians) active job count |
| **Notifications** | List with mark read / mark all read; links to related resources |
| **Settings** | Placeholders for branding, notifications, permissions, integrations |

---

## Design (Wraptors)

- **Theme**: Dark (black/charcoal) with **gold** accent (`#C8A45D`).
- **UI**: Minimal, high contrast, cards and spacing tuned for a premium automotive SaaS feel.
- **Tailwind**: Custom colors in `tailwind.config.ts` (`wraptors-black`, `wraptors-gold`, etc.).

---

## Data model (mobile app alignment)

Models are built so the staff portal can drive the customer mobile app:

- **ServiceJob** + **JobStageUpdate**: Stage and progress match the mobile app (e.g. 10% intake → 100% ready). Updates in the portal should be stored so the app can subscribe or poll.
- **Customer**, **Vehicle**: Same entities the app uses for profile and vehicle list.
- **QuoteRequest**: From app (or other channels); status flow supports “convert to job”.
- **MediaAsset**: Tied to jobs; used for technician photos/videos the customer sees in the app.

All entities include `shopId` for multi-tenant use later.

---

## License

Private — Wraptors Inc.
