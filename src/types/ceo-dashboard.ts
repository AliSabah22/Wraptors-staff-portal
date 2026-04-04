export type CeoSelectedPeriodSummary = {
  active_in_shop: number
  jobs_due_in_period: number
  pending_quotes: number
  jobs_completed: number
  quotes_sent: number
  new_customers: number
  avg_job_value: number
  conversion_rate: number
}

export type CeoDashboardPayload = {
  tiles: {
    revenue_today: number
    revenue_yesterday: number
    revenue_this_week: number
    revenue_prev_week: number
    week_vs_prev_week_percent: number | null
    active_jobs: number
    jobs_due_today: number
    jobs_overdue: number
    quote_requests_new: number
    ready_for_pickup: number
    ready_pickup_all_notified: boolean
    outstanding_invoice_total: number
    outstanding_invoice_count: number
    warranties_expiring_30d: number
  }
  new_quotes: {
    id: string
    customer_name: string
    services_requested: string[] | null
    created_at: string
  }[]
  new_quotes_more: number
  outstanding_invoices: {
    id: string
    total: number
    status: string
    due_date: string | null
    created_at: string | null
    customer_name: string | null
  }[]
  /** Metrics for the CEO-selected date range (due date or created date falls in range). */
  selected_period: {
    from_day: string
    to_day: string
    paid_revenue: number
    revenue_by_service: { name: string; revenue: number }[]
    summary: CeoSelectedPeriodSummary
    job_status_pie: { name: string; value: number; color: string }[]
  }
  technicians: {
    period: 'week' | 'month'
    technicians: {
      id: string
      name: string
      completed_jobs: number
      revenue: number
      avg_rating: number | null
    }[]
  }
  live_jobs: unknown[]
}
