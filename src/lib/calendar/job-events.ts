/**
 * Derive calendar events from jobs for the scheduling/planning surface.
 * Single source of truth for event types and risk flags.
 */

import type { ServiceJob } from "@/types";
import { isStandardPriority, EARLY_STAGES } from "@/lib/job-workflow/config";
import {
  startOfDay,
  endOfDay,
  addDays,
  isBefore,
  isAfter,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from "date-fns";

export type CalendarEventType = "drop_off" | "scheduled_start" | "due" | "pickup" | "pickup_target";

export interface CalendarEvent {
  id: string;
  jobId: string;
  type: CalendarEventType;
  date: string; // YYYY-MM-DD
  time?: string;
  label: string;
  /** Customer name for display */
  customerName: string;
  /** Vehicle label (year make model) */
  vehicleLabel: string;
  /** Service name */
  serviceName: string;
  /** Technician name if assigned */
  technicianName?: string;
  /** Priority if non-standard */
  priority?: string;
  isBlocked?: boolean;
  isUnassigned?: boolean;
  isOverdue?: boolean;
  isAtRisk?: boolean;
}

export const CALENDAR_EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  drop_off: "Drop-off",
  scheduled_start: "Start",
  due: "Done by",
  pickup: "Pickup",
  pickup_target: "Expected pickup",
};

/** Parse YYYY-MM-DD (or ISO with time) as local midnight so calendar day is correct in all timezones. */
function toLocalDate(dateStr: string): Date {
  const part = dateStr.slice(0, 10);
  const [y, m, d] = part.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Normalize to YYYY-MM-DD with leading zeros so calendar lookups match format(anchor, "yyyy-MM-dd"). */
function toDateKey(dateStr: string): string {
  const part = dateStr.slice(0, 10);
  const parts = part.split("-").map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return part;
  const [y, m, d] = parts;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function isJobAtRisk(job: ServiceJob, today: Date): boolean {
  if (job.isBlocked) return true;
  if (!job.assignedTechnicianId) return true;
  const due = toLocalDate(job.dueDate);
  const inEarlyStage = (EARLY_STAGES as readonly string[]).includes(job.stage);
  if (inEarlyStage && !isAfter(due, addDays(today, 2))) return true;
  return false;
}

function isJobOverdue(job: ServiceJob, today: Date): boolean {
  if (job.stage === "ready" || job.completedAt) return false;
  const due = toLocalDate(job.dueDate);
  return isBefore(due, today);
}

/**
 * Build calendar events from a list of jobs. Uses job scheduling fields only.
 */
export function buildCalendarEvents(
  jobs: ServiceJob[],
  resolveCustomer: (id: string) => string,
  resolveVehicle: (id: string) => string,
  resolveService: (id: string) => string,
  resolveTechnician: (id: string | undefined) => string
): CalendarEvent[] {
  const today = startOfDay(new Date());
  const events: CalendarEvent[] = [];

  for (const job of jobs) {
    const customerName = resolveCustomer(job.customerId);
    const vehicleLabel = resolveVehicle(job.vehicleId);
    const serviceName = resolveService(job.serviceId);
    const technicianName = job.assignedTechnicianId
      ? resolveTechnician(job.assignedTechnicianId)
      : undefined;
    const isUnassigned = !job.assignedTechnicianId;
    const isBlocked = !!job.isBlocked;
    const overdue = isJobOverdue(job, today);
    const atRisk = isJobAtRisk(job, today);

    // Drop-off: dropOffDate or scheduledStartDate or createdAt date (YYYY-MM-DD)
    const dropRaw = job.dropOffDate ?? job.scheduledStartDate?.slice(0, 10) ?? job.createdAt.slice(0, 10);
    const dropDate = toDateKey(dropRaw.includes("T") ? dropRaw.slice(0, 10) : dropRaw);
    events.push({
      id: `cal_${job.id}_drop`,
      jobId: job.id,
      type: "drop_off",
      date: dropDate,
      label: CALENDAR_EVENT_TYPE_LABELS.drop_off,
      customerName,
      vehicleLabel,
      serviceName,
      technicianName,
      priority: !isStandardPriority(job.priority) ? job.priority : undefined,
      isBlocked,
      isUnassigned,
      isOverdue: false,
      isAtRisk: atRisk,
    });

    // Scheduled start (whenever set — always show as its own time block)
    if (job.scheduledStartDate) {
      const startDate = toDateKey(job.scheduledStartDate.slice(0, 10));
      events.push({
        id: `cal_${job.id}_start`,
        jobId: job.id,
        type: "scheduled_start",
        date: startDate,
        time: job.scheduledStartDate.includes("T") ? job.scheduledStartDate.slice(11, 16) : undefined,
        label: CALENDAR_EVENT_TYPE_LABELS.scheduled_start,
        customerName,
        vehicleLabel,
        serviceName,
        technicianName,
        priority: !isStandardPriority(job.priority) ? job.priority : undefined,
        isBlocked,
        isUnassigned,
        isOverdue: false,
        isAtRisk: atRisk,
      });
    }

    // Due date (when the car is supposed to be done) — normalize to YYYY-MM-DD
    const dueDateOnly = toDateKey(job.dueDate.includes("T") ? job.dueDate.slice(0, 10) : job.dueDate.slice(0, 10));
    events.push({
      id: `cal_${job.id}_due`,
      jobId: job.id,
      type: "due",
      date: dueDateOnly,
      label: CALENDAR_EVENT_TYPE_LABELS.due,
      customerName,
      vehicleLabel,
      serviceName,
      technicianName,
      priority: !isStandardPriority(job.priority) ? job.priority : undefined,
      isBlocked,
      isUnassigned,
      isOverdue: overdue,
      isAtRisk: atRisk,
    });

    // Pickup: when ready or completed (use completedAt date or due date for "ready" jobs)
    if (job.stage === "ready" || job.completedAt) {
      const pickupRaw = job.completedAt
        ? job.completedAt.slice(0, 10)
        : job.pickupTargetTime?.slice(0, 10) ?? job.dueDate;
      const pickupDate = toDateKey(pickupRaw.includes("T") ? pickupRaw.slice(0, 10) : pickupRaw.slice(0, 10));
      events.push({
        id: `cal_${job.id}_pickup`,
        jobId: job.id,
        type: "pickup",
        date: pickupDate,
        time: job.pickupTargetTime?.slice(11, 16),
        label: CALENDAR_EVENT_TYPE_LABELS.pickup,
        customerName,
        vehicleLabel,
        serviceName,
        technicianName,
        priority: !isStandardPriority(job.priority) ? job.priority : undefined,
        isBlocked: false,
        isUnassigned: false,
        isOverdue: false,
        isAtRisk: false,
      });
    }

    // Expected pickup (scheduled): when pickupTargetTime is set and job not yet ready — for planning
    if (
      job.pickupTargetTime &&
      job.stage !== "ready" &&
      !job.completedAt
    ) {
      const targetDate = toDateKey(job.pickupTargetTime.slice(0, 10));
      events.push({
        id: `cal_${job.id}_pickup_target`,
        jobId: job.id,
        type: "pickup_target",
        date: targetDate,
        time: job.pickupTargetTime.slice(11, 16),
        label: CALENDAR_EVENT_TYPE_LABELS.pickup_target,
        customerName,
        vehicleLabel,
        serviceName,
        technicianName,
        priority: !isStandardPriority(job.priority) ? job.priority : undefined,
        isBlocked: !!job.isBlocked,
        isUnassigned: !job.assignedTechnicianId,
        isOverdue: false,
        isAtRisk: atRisk,
      });
    }
  }

  return events;
}

/** Filter events to a date range (inclusive). Uses local date for event.date so events show on the correct calendar day. */
export function filterEventsByRange(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  const start = startOfDay(rangeStart);
  const end = endOfDay(rangeEnd);
  return events.filter((ev) => {
    const d = toLocalDate(ev.date);
    return isWithinInterval(d, { start, end }) || isSameDay(d, start) || isSameDay(d, end);
  });
}

/** Group events by date string (YYYY-MM-DD). */
export function groupEventsByDate(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const map: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    if (!map[ev.date]) map[ev.date] = [];
    map[ev.date].push(ev);
  }
  return map;
}

/** Get week dates (Mon–Sun). */
export function getWeekDates(anchor: Date): Date[] {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Get month grid: array of weeks, each week is array of 7 days. */
export function getMonthGrid(anchor: Date): Date[][] {
  const monthStart = startOfMonth(anchor);
  const start = startOfWeek(monthStart, { weekStartsOn: 1 });
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(addDays(start, w * 7 + d));
    }
    weeks.push(week);
  }
  return weeks;
}
