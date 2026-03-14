/**
 * Server-side analytics context for Wraptors Intelligence.
 * Queries mock/seed data and returns structured JSON for the AI.
 * All functions handle empty data gracefully.
 */

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  subMonths,
  subWeeks,
  differenceInDays,
  isBefore,
  isAfter,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import type { ServiceJob, Invoice, PipelineLead, Customer, StaffUser } from "@/types";
import { mockJobs } from "@/data/mock";
import { mockInvoices } from "@/data/mock";
import { mockPipeline } from "@/data/mock";
import { mockCustomers } from "@/data/mock";
import { mockStaff } from "@/data/mock";
import { mockServices } from "@/data/mock";
import { seedSmartQuotes, seedQuoteLineItems } from "@/data/quote-builder-seed";

const now = new Date();

function safeSum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export interface RevenueContext {
  total_revenue_this_month: number;
  total_revenue_last_month: number;
  total_revenue_this_week: number;
  revenue_by_service_type: Array<{ service_name: string; total: number; job_count: number }>;
  average_job_value_this_month: number;
  highest_value_job_this_month: { job_id: string; service: string; customer_name: string; total: number } | null;
  revenue_trend: Array<{ week: string; total: number }>;
}

export function getRevenueContext(): RevenueContext {
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const jobIdToInvoice = new Map<string, Invoice>();
  mockInvoices.forEach((inv) => jobIdToInvoice.set(inv.jobId, inv));

  const jobIdToJob = new Map<string, ServiceJob>();
  mockJobs.forEach((j) => jobIdToJob.set(j.id, j));

  const serviceIdToName = new Map<string, string>();
  mockServices.forEach((s) => serviceIdToName.set(s.id, s.name));

  const customerIdToName = new Map<string, string>();
  mockCustomers.forEach((c) => customerIdToName.set(c.id, c.name));

  const revenueByJob = (inv: Invoice): number => (inv.status === "paid" || inv.status === "sent" ? inv.total : 0);

  const thisMonthInvoices = mockInvoices.filter((inv) => {
    const d = parseISO(inv.createdAt);
    return isWithinInterval(d, { start: thisMonthStart, end: thisMonthEnd });
  });
  const lastMonthInvoices = mockInvoices.filter((inv) => {
    const d = parseISO(inv.createdAt);
    return isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd });
  });
  const thisWeekInvoices = mockInvoices.filter((inv) => {
    const d = parseISO(inv.createdAt);
    return isWithinInterval(d, { start: thisWeekStart, end: thisWeekEnd });
  });

  const total_revenue_this_month = safeSum(thisMonthInvoices.map(revenueByJob));
  const total_revenue_last_month = safeSum(lastMonthInvoices.map(revenueByJob));
  const total_revenue_this_week = safeSum(thisWeekInvoices.map(revenueByJob));

  const serviceTotals = new Map<string, { total: number; job_count: number }>();
  thisMonthInvoices.forEach((inv) => {
    const rev = revenueByJob(inv);
    const job = jobIdToJob.get(inv.jobId);
    const name = job ? serviceIdToName.get(job.serviceId) ?? "Unknown" : "Unknown";
    const cur = serviceTotals.get(name) ?? { total: 0, job_count: 0 };
    cur.total += rev;
    cur.job_count += 1;
    serviceTotals.set(name, cur);
  });
  const revenue_by_service_type = Array.from(serviceTotals.entries()).map(([service_name, v]) => ({
    service_name,
    total: v.total,
    job_count: v.job_count,
  }));

  const countThisMonth = thisMonthInvoices.filter((inv) => revenueByJob(inv) > 0).length;
  const average_job_value_this_month = countThisMonth > 0 ? total_revenue_this_month / countThisMonth : 0;

  let highest_value_job_this_month: RevenueContext["highest_value_job_this_month"] = null;
  thisMonthInvoices.forEach((inv) => {
    const rev = revenueByJob(inv);
    if (rev <= 0) return;
    const job = jobIdToJob.get(inv.jobId);
    if (!job) return;
    const service = serviceIdToName.get(job.serviceId) ?? "Unknown";
    const customer_name = customerIdToName.get(job.customerId) ?? "Unknown";
    if (!highest_value_job_this_month || rev > highest_value_job_this_month.total) {
      highest_value_job_this_month = { job_id: job.id, service, customer_name, total: rev };
    }
  });

  const revenue_trend: Array<{ week: string; total: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekStart = startOfWeek(weekEnd, { weekStartsOn: 1 });
    const total = mockInvoices
      .filter((inv) => {
        const d = parseISO(inv.createdAt);
        return isWithinInterval(d, { start: weekStart, end: weekEnd }) && revenueByJob(inv) > 0;
      })
      .reduce((s, inv) => s + revenueByJob(inv), 0);
    revenue_trend.push({ week: weekStart.toISOString().slice(0, 10), total });
  }

  return {
    total_revenue_this_month,
    total_revenue_last_month,
    total_revenue_this_week,
    revenue_by_service_type,
    average_job_value_this_month: Math.round(average_job_value_this_month * 100) / 100,
    highest_value_job_this_month,
    revenue_trend,
  };
}

export interface JobsContext {
  total_active_jobs: number;
  total_jobs_completed_this_month: number;
  total_jobs_completed_last_month: number;
  jobs_by_stage: Array<{ stage: string; count: number }>;
  jobs_by_status: Array<{ status: string; count: number }>;
  blocked_jobs_count: number;
  overdue_jobs: Array<{ job_id: string; customer_name: string; service: string; due_date: string; days_overdue: number }>;
  average_completion_time_days: number;
  jobs_with_no_scheduled_start: number;
  rework_jobs_this_month: number;
}

export function getJobsContext(): JobsContext {
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const thirtyDaysAgo = subWeeks(now, 4);

  const customerIdToName = new Map(mockCustomers.map((c) => [c.id, c.name]));
  const serviceIdToName = new Map(mockServices.map((s) => [s.id, s.name]));

  const activeJobs = mockJobs.filter((j) => !j.completedAt && j.stage !== "ready");
  const completedThisMonth = mockJobs.filter((j) => {
    if (!j.completedAt) return false;
    const d = parseISO(j.completedAt);
    return isWithinInterval(d, { start: thisMonthStart, end: thisMonthEnd });
  });
  const completedLastMonth = mockJobs.filter((j) => {
    if (!j.completedAt) return false;
    const d = parseISO(j.completedAt);
    return isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd });
  });

  const stageCounts = new Map<string, number>();
  mockJobs.forEach((j) => {
    if (!j.completedAt) {
      const c = stageCounts.get(j.stage) ?? 0;
      stageCounts.set(j.stage, c + 1);
    }
  });
  const jobs_by_stage = Array.from(stageCounts.entries()).map(([stage, count]) => ({ stage, count }));

  const statusCounts = new Map<string, number>();
  mockJobs.forEach((j) => {
    const s = j.status ?? "active";
    statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
  });
  const jobs_by_status = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }));

  const blocked_jobs_count = mockJobs.filter((j) => j.isBlocked || j.blockerRequest).length;

  const overdue_jobs = mockJobs
    .filter((j) => {
      if (j.completedAt) return false;
      const due = parseISO(j.dueDate);
      return isBefore(due, startOfDay(now));
    })
    .map((j) => {
      const due = parseISO(j.dueDate);
      const days_overdue = differenceInDays(startOfDay(now), due);
      const customer_name = customerIdToName.get(j.customerId) ?? "Unknown";
      const service = serviceIdToName.get(j.serviceId) ?? "Unknown";
      return {
        job_id: j.id,
        customer_name,
        service,
        due_date: j.dueDate,
        days_overdue,
      };
    });

  const completedWithStageUpdates = mockJobs.filter((j) => j.completedAt && j.stageUpdates?.length >= 2);
  const completionTimes = completedWithStageUpdates
    .filter((j) => {
      const completedAt = j.completedAt!;
      return isAfter(parseISO(completedAt), thirtyDaysAgo);
    })
    .map((j) => {
      const first = j.stageUpdates[0];
      const last = j.stageUpdates[j.stageUpdates.length - 1];
      return differenceInDays(parseISO(j.completedAt!), parseISO(first.createdAt));
    });
  const average_completion_time_days =
    completionTimes.length > 0 ? safeSum(completionTimes) / completionTimes.length : 0;

  const jobs_with_no_scheduled_start = mockJobs.filter(
    (j) => !j.completedAt && (!j.scheduledStartDate || !j.scheduledStartDate.trim())
  ).length;

  const rework_jobs_this_month = mockJobs.filter((j) => {
    const hasRework = j.blockerRequest?.type === "rework_needed" || j.blockerHistory?.some((h) => h.blockType === "rework_needed");
    if (!hasRework) return false;
    const updated = j.updatedAt ? parseISO(j.updatedAt) : now;
    return isWithinInterval(updated, { start: thisMonthStart, end: thisMonthEnd });
  }).length;

  return {
    total_active_jobs: activeJobs.length,
    total_jobs_completed_this_month: completedThisMonth.length,
    total_jobs_completed_last_month: completedLastMonth.length,
    jobs_by_stage,
    jobs_by_status,
    blocked_jobs_count,
    overdue_jobs,
    average_completion_time_days: Math.round(average_completion_time_days * 10) / 10,
    jobs_with_no_scheduled_start,
    rework_jobs_this_month,
  };
}

export interface PipelineContext {
  total_leads: number;
  leads_by_stage: Array<{ stage: string; count: number }>;
  leads_by_source: Array<{ source: string; count: number }>;
  conversion_rate: number;
  average_time_in_stage: Array<{ stage: string; avg_days: number }>;
  leads_stale_over_7_days: number;
  lost_leads_this_month: { count: number; most_common_last_stage: string | null };
}

export function getPipelineContext(): PipelineContext {
  const sevenDaysAgo = subWeeks(now, 1);
  const ninetyDaysAgo = subWeeks(now, 13);
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  const total_leads = mockPipeline.length;
  const stageCounts = new Map<string, number>();
  mockPipeline.forEach((l) => {
    stageCounts.set(l.stage, (stageCounts.get(l.stage) ?? 0) + 1);
  });
  const leads_by_stage = Array.from(stageCounts.entries()).map(([stage, count]) => ({ stage, count }));

  const sourceCounts = new Map<string, number>();
  mockPipeline.forEach((l) => {
    const src = l.source ?? "unknown";
    sourceCounts.set(src, (sourceCounts.get(src) ?? 0) + 1);
  });
  const leads_by_source = Array.from(sourceCounts.entries()).map(([source, count]) => ({ source, count }));

  const leadsWithCustomer = mockPipeline.filter((l) => l.customerId).length;
  const conversion_rate = total_leads > 0 ? Math.round((leadsWithCustomer / total_leads) * 100) : 0;

  const leads_stale_over_7_days = mockPipeline.filter((l) => {
    const updated = parseISO(l.updatedAt);
    return isBefore(updated, sevenDaysAgo) && l.stage !== "lost" && l.stage !== "booked";
  }).length;

  const lostThisMonth = mockPipeline.filter((l) => {
    if (l.stage !== "lost") return false;
    const updated = parseISO(l.updatedAt);
    return isWithinInterval(updated, { start: thisMonthStart, end: thisMonthEnd });
  });
  const lastStageCounts = new Map<string, number>();
  lostThisMonth.forEach((l) => {
    const s = l.stage;
    lastStageCounts.set(s, (lastStageCounts.get(s) ?? 0) + 1);
  });
  let most_common_last_stage: string | null = null;
  let max = 0;
  lastStageCounts.forEach((count, stage) => {
    if (count > max) {
      max = count;
      most_common_last_stage = stage;
    }
  });

  const average_time_in_stage: Array<{ stage: string; avg_days: number }> = leads_by_stage.map(({ stage }) => ({
    stage,
    avg_days: 0, // POST-LAUNCH: compute from lead history
  }));

  return {
    total_leads,
    leads_by_stage,
    leads_by_source,
    conversion_rate,
    average_time_in_stage,
    leads_stale_over_7_days,
    lost_leads_this_month: { count: lostThisMonth.length, most_common_last_stage },
  };
}

export interface QuoteContext {
  total_quotes_sent_this_month: number;
  total_quotes_sent_last_month: number;
  acceptance_rate_this_month: number;
  acceptance_rate_last_month: number;
  average_quote_value: number;
  quotes_by_status: Array<{ status: string; count: number }>;
  quotes_pending_response: number;
  quotes_expiring_soon: number;
  top_quoted_services: Array<{ service_name: string; count: number }>;
}

export function getQuoteContext(): QuoteContext {
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const sevenDaysFromNow = endOfDay(subWeeks(now, -1));

  const sentThisMonth = seedSmartQuotes.filter((q) => {
    if (!q.sentAt) return false;
    const d = parseISO(q.sentAt);
    return isWithinInterval(d, { start: thisMonthStart, end: thisMonthEnd });
  });
  const sentLastMonth = seedSmartQuotes.filter((q) => {
    if (!q.sentAt) return false;
    const d = parseISO(q.sentAt);
    return isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd });
  });

  const acceptedThisMonth = sentThisMonth.filter((q) => q.status === "accepted").length;
  const acceptedLastMonth = sentLastMonth.filter((q) => q.status === "accepted").length;
  const acceptance_rate_this_month = sentThisMonth.length > 0 ? Math.round((acceptedThisMonth / sentThisMonth.length) * 100) : 0;
  const acceptance_rate_last_month = sentLastMonth.length > 0 ? Math.round((acceptedLastMonth / sentLastMonth.length) * 100) : 0;

  const acceptedQuotes = seedSmartQuotes.filter((q) => q.status === "accepted");
  const average_quote_value =
    acceptedQuotes.length > 0
      ? acceptedQuotes.reduce((s, q) => s + q.total, 0) / acceptedQuotes.length
      : 0;

  const statusCounts = new Map<string, number>();
  seedSmartQuotes.forEach((q) => {
    statusCounts.set(q.status, (statusCounts.get(q.status) ?? 0) + 1);
  });
  const quotes_by_status = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }));

  const quotes_pending_response = seedSmartQuotes.filter(
    (q) => q.status === "sent"
  ).length;

  const quotes_expiring_soon = seedSmartQuotes.filter((q) => {
    const validUntil = parseISO(q.validUntil);
    return isWithinInterval(validUntil, { start: startOfDay(now), end: sevenDaysFromNow }) && q.status === "sent";
  }).length;

  const serviceCounts = new Map<string, number>();
  seedQuoteLineItems.forEach((li) => {
    if (li.type === "service" && li.label) {
      const name = li.label.replace(/\s*\((\w+)\)$/, "").trim() || "Service";
      serviceCounts.set(name, (serviceCounts.get(name) ?? 0) + 1);
    }
  });
  const top_quoted_services = Array.from(serviceCounts.entries())
    .map(([service_name, count]) => ({ service_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total_quotes_sent_this_month: sentThisMonth.length,
    total_quotes_sent_last_month: sentLastMonth.length,
    acceptance_rate_this_month,
    acceptance_rate_last_month,
    average_quote_value: Math.round(average_quote_value * 100) / 100,
    quotes_by_status,
    quotes_pending_response,
    quotes_expiring_soon,
    top_quoted_services,
  };
}

const DEFAULT_MAX_CAPACITY = 5;

export interface TechnicianContext {
  technicians: Array<{
    id: string;
    name: string;
    active_jobs_count: number;
    completed_jobs_this_month: number;
    average_completion_time_days: number;
    blocked_jobs_count: number;
    rework_count_this_month: number;
    utilization_score: number;
  }>;
}

export function getTechnicianContext(): TechnicianContext {
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const technicians = mockStaff.filter((s) => s.role === "technician") as StaffUser[];

  const list = technicians.map((t) => {
    const active = mockJobs.filter(
      (j) => !j.completedAt && j.assignedTechnicianId === t.id
    );
    const completedThisMonth = mockJobs.filter(
      (j) =>
        j.completedAt &&
        j.assignedTechnicianId === t.id &&
        isWithinInterval(parseISO(j.completedAt), { start: thisMonthStart, end: thisMonthEnd })
    );
    const completionTimes = completedThisMonth
      .filter((j) => j.stageUpdates?.length >= 2)
      .map((j) => {
        const first = j.stageUpdates![0];
        return differenceInDays(parseISO(j.completedAt!), parseISO(first.createdAt));
      });
    const average_completion_time_days =
      completionTimes.length > 0 ? safeSum(completionTimes) / completionTimes.length : 0;
    const blocked = active.filter((j) => j.isBlocked || j.blockerRequest).length;
    const rework = mockJobs.filter(
      (j) =>
        j.assignedTechnicianId === t.id &&
        (j.blockerRequest?.type === "rework_needed" || j.blockerHistory?.some((h) => h.blockType === "rework_needed")) &&
        j.updatedAt &&
        isWithinInterval(parseISO(j.updatedAt), { start: thisMonthStart, end: thisMonthEnd })
    ).length;
    const utilization_score = Math.min(1, active.length / DEFAULT_MAX_CAPACITY);

    return {
      id: t.id,
      name: t.name,
      active_jobs_count: active.length,
      completed_jobs_this_month: completedThisMonth.length,
      average_completion_time_days: Math.round(average_completion_time_days * 10) / 10,
      blocked_jobs_count: blocked,
      rework_count_this_month: rework,
      utilization_score: Math.round(utilization_score * 100) / 100,
    };
  });

  return { technicians: list };
}

export interface CustomerContext {
  total_customers: number;
  new_customers_this_month: number;
  new_customers_last_month: number;
  returning_customers_this_month: number;
  top_customers_by_revenue: Array<{ customer_name: string; total_spend: number; job_count: number }>;
  customers_inactive_6_months: number;
  average_customer_lifetime_value: number;
}

export function getCustomerContext(): CustomerContext {
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const sixMonthsAgo = subWeeks(now, 26);

  const total_customers = mockCustomers.length;
  const new_customers_this_month = mockCustomers.filter((c) =>
    isWithinInterval(parseISO(c.createdAt), { start: thisMonthStart, end: thisMonthEnd })
  ).length;
  const new_customers_last_month = mockCustomers.filter((c) =>
    isWithinInterval(parseISO(c.createdAt), { start: lastMonthStart, end: lastMonthEnd })
  ).length;

  const jobCountByCustomer = new Map<string, number>();
  mockJobs.forEach((j) => {
    jobCountByCustomer.set(j.customerId, (jobCountByCustomer.get(j.customerId) ?? 0) + 1);
  });
  const returning_customers_this_month = mockCustomers.filter((c) => (jobCountByCustomer.get(c.id) ?? 0) >= 2).length;

  const top_customers_by_revenue = mockCustomers
    .map((c) => ({
      customer_name: c.name,
      total_spend: c.totalSpend ?? 0,
      job_count: jobCountByCustomer.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.total_spend - a.total_spend)
    .slice(0, 5);

  const customers_inactive_6_months = mockCustomers.filter((c) => {
    const jobDates = mockJobs.filter((j) => j.customerId === c.id).map((j) => j.updatedAt || j.createdAt);
    if (jobDates.length === 0) return true;
    const last = jobDates.sort().pop()!;
    return isBefore(parseISO(last), sixMonthsAgo);
  }).length;

  const totalRevenue = mockCustomers.reduce((s, c) => s + (c.totalSpend ?? 0), 0);
  const average_customer_lifetime_value = total_customers > 0 ? totalRevenue / total_customers : 0;

  return {
    total_customers,
    new_customers_this_month,
    new_customers_last_month,
    returning_customers_this_month,
    top_customers_by_revenue,
    customers_inactive_6_months,
    average_customer_lifetime_value: Math.round(average_customer_lifetime_value * 100) / 100,
  };
}

export interface CalendarContext {
  jobs_scheduled_this_week: number;
  jobs_scheduled_next_week: number;
  todays_dropoffs: number;
  todays_pickups: number;
  unscheduled_jobs: number;
  technician_availability_this_week: Array<{ technician_name: string; assigned_jobs: number; open_slots: number }>;
}

export function getCalendarContext(): CalendarContext {
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const nextWeekStart = startOfWeek(subWeeks(now, -1), { weekStartsOn: 1 });
  const nextWeekEnd = endOfWeek(subWeeks(now, -1), { weekStartsOn: 1 });
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const activeJobs = mockJobs.filter((j) => !j.completedAt);
  const jobs_scheduled_this_week = activeJobs.filter((j) => {
    const d = j.scheduledStartDate ? parseISO(j.scheduledStartDate) : null;
    return d && isWithinInterval(d, { start: thisWeekStart, end: thisWeekEnd });
  }).length;
  const jobs_scheduled_next_week = activeJobs.filter((j) => {
    const d = j.scheduledStartDate ? parseISO(j.scheduledStartDate) : null;
    return d && isWithinInterval(d, { start: nextWeekStart, end: nextWeekEnd });
  }).length;

  const todays_dropoffs = mockJobs.filter((j) => {
    const d = j.dropOffDate ? parseISO(j.dropOffDate) : null;
    return d && isWithinInterval(d, { start: todayStart, end: todayEnd });
  }).length;
  const todays_pickups = mockJobs.filter((j) => {
    const d = j.pickupTargetTime ? parseISO(j.pickupTargetTime) : null;
    return d && isWithinInterval(d, { start: todayStart, end: todayEnd });
  }).length;

  const unscheduled_jobs = activeJobs.filter((j) => !j.scheduledStartDate || !j.scheduledStartDate.trim()).length;

  const technicians = mockStaff.filter((s) => s.role === "technician");
  const technician_availability_this_week = technicians.map((t) => {
    const assigned = activeJobs.filter(
      (j) =>
        j.assignedTechnicianId === t.id &&
        j.scheduledStartDate &&
        isWithinInterval(parseISO(j.scheduledStartDate), { start: thisWeekStart, end: thisWeekEnd })
    ).length;
    const open_slots = Math.max(0, DEFAULT_MAX_CAPACITY - assigned);
    return {
      technician_name: t.name,
      assigned_jobs: assigned,
      open_slots,
    };
  });

  return {
    jobs_scheduled_this_week,
    jobs_scheduled_next_week,
    todays_dropoffs,
    todays_pickups,
    unscheduled_jobs,
    technician_availability_this_week,
  };
}
