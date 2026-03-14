"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isSameMonth,
  parseISO,
} from "date-fns";
import { useJobsStore, useCustomersStore, useVehiclesStore, useServicesStore, useTeamStore, getJobsNeedingSchedulingFilter } from "@/stores";
import { getScopedJobs } from "@/lib/data-scope/scope";
import {
  buildCalendarEvents,
  groupEventsByDate,
  getWeekDates,
  getMonthGrid,
  CALENDAR_EVENT_TYPE_LABELS,
  type CalendarEvent,
} from "@/lib/calendar/job-events";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRehydrateJobsOnFocus } from "@/hooks/useRehydrateJobsOnFocus";
import { useJobsForTracking } from "@/hooks/useJobsForTracking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Car,
  Package,
  UserCog,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { mockServices } from "@/data/mock";

type ViewMode = "day" | "week" | "month";

function getServiceName(id: string) {
  return mockServices.find((s) => s.id === id)?.name ?? "—";
}

export default function CalendarPage() {
  const today = startOfDay(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState(today);
  const [filterTechnician, setFilterTechnician] = useState<string>("all");
  const [filterService, setFilterService] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [jobsHydrated, setJobsHydrated] = useState(false);

  const { jobs, trackingKey } = useJobsForTracking();

  // Rehydrate jobs so "Unscheduled jobs" and tracking stay in sync when switching tabs or navigating
  useRehydrateJobsOnFocus();

  // Re-render when persisted jobs have loaded so calendar shows saved scheduling
  useEffect(() => {
    const persist = useJobsStore.persist;
    if (!persist) {
      setJobsHydrated(true);
      return;
    }
    if (persist.hasHydrated?.()) setJobsHydrated(true);
    const unsub = persist.onFinishHydration?.(() => setJobsHydrated(true));
    return () => unsub?.();
  }, []);
  const customers = useCustomersStore((s) => s.customers);
  const getVehicleById = useVehiclesStore((s) => s.getVehicleById);
  const teamMembers = useTeamStore((s) => s.members);
  const services = useServicesStore((s) => s.services).filter((s) => s.active);
  const { user, role } = useCurrentUser();

  const scopedJobs = useMemo(
    () => getScopedJobs(role, user?.id, Array.isArray(jobs) ? jobs : []),
    [role, user?.id, jobs]
  );

  const filteredJobs = useMemo(() => {
    let list = scopedJobs;
    if (filterTechnician !== "all") {
      list = list.filter((j) => j.assignedTechnicianId === filterTechnician);
    }
    if (filterService !== "all") {
      list = list.filter((j) => j.serviceId === filterService);
    }
    if (filterStatus !== "all") {
      if (filterStatus === "blocked") list = list.filter((j) => j.isBlocked);
      else if (filterStatus === "unassigned") list = list.filter((j) => !j.assignedTechnicianId);
      else if (filterStatus === "intake") list = list.filter((j) => j.stage === "intake");
    }
    return list;
  }, [scopedJobs, filterTechnician, filterService, filterStatus]);

  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";
  const getVehicleLabel = (id: string) => {
    const v = getVehicleById(id);
    return v ? `${v.year} ${v.make} ${v.model}` : "—";
  };
  const getTechnicianName = (id: string | undefined) =>
    id ? teamMembers.find((m) => m.id === id)?.name ?? "—" : "Unassigned";

  const allEvents = useMemo(
    () =>
      buildCalendarEvents(
        filteredJobs,
        getCustomerName,
        getVehicleLabel,
        getServiceName,
        getTechnicianName
      ),
    [filteredJobs, customers, getVehicleById, teamMembers]
  );

  const rangeStart = useMemo(() => {
    if (viewMode === "day") return anchor;
    if (viewMode === "week") return startOfWeek(anchor, { weekStartsOn: 1 });
    return startOfMonth(anchor);
  }, [viewMode, anchor]);
  const rangeEnd = useMemo(() => {
    if (viewMode === "day") return anchor;
    if (viewMode === "week") return endOfWeek(anchor, { weekStartsOn: 1 });
    return endOfMonth(anchor);
  }, [viewMode, anchor]);

  // Group calendar events (scheduled start, due, pickup target) by date

  const todayStr = format(today, "yyyy-MM-dd");
  const scheduledStartsToday = useMemo(
    () =>
      allEvents.filter(
        (e) => e.type === "scheduled_start" && e.date === todayStr
      ),
    [allEvents, todayStr]
  );
  const dueToday = useMemo(
    () =>
      allEvents.filter(
        (e) => e.type === "due" && e.date === todayStr
      ),
    [allEvents, todayStr]
  );
  const pickupTargetsToday = useMemo(
    () =>
      allEvents.filter(
        (e) => e.type === "pickup_target" && e.date === todayStr
      ),
    [allEvents, todayStr]
  );
  const blockedOrAtRisk = useMemo(
    () =>
      allEvents.filter((e) => e.isBlocked || e.isAtRisk),
    [allEvents]
  );
  const blockedOrAtRiskJobIds = useMemo(
    () => new Set(blockedOrAtRisk.map((e) => e.jobId)),
    [blockedOrAtRisk]
  );

  const unscheduledJobs = useMemo(
    () =>
      filteredJobs
        .filter((j) => getJobsNeedingSchedulingFilter(j))
        .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime()),
    [filteredJobs, trackingKey]
  );

  const upcomingPickups = useMemo(
    () =>
      allEvents
        .filter((e) => e.type === "pickup_target")
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 10),
    [allEvents]
  );

  const techWorkload = useMemo(() => {
    const active = filteredJobs.filter((j) => j.stage !== "ready" && !j.completedAt);
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    return teamMembers
      .filter((t) => t.role === "technician")
      .map((t) => {
        const techActive = active.filter((j) => j.assignedTechnicianId === t.id);
        const dueThisWeek = techActive.filter((j) => {
          const d = new Date(j.dueDate).getTime();
          return d >= weekStart.getTime() && d <= weekEnd.getTime();
        }).length;
        return {
          id: t.id,
          name: t.name,
          count: techActive.length,
          dueThisWeek,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [filteredJobs, teamMembers, today]);

  const technicians = useMemo(
    () => teamMembers.filter((m) => m.role === "technician"),
    [teamMembers]
  );

  const weekDays = useMemo(() => getWeekDates(anchor), [anchor]);
  const monthGrid = useMemo(() => getMonthGrid(anchor), [anchor]);

  const goPrev = () => {
    if (viewMode === "day") setAnchor((d) => subDays(d, 1));
    else if (viewMode === "week") setAnchor((d) => subWeeks(d, 1));
    else setAnchor((d) => subMonths(d, 1));
  };
  const goNext = () => {
    if (viewMode === "day") setAnchor((d) => addDays(d, 1));
    else if (viewMode === "week") setAnchor((d) => addWeeks(d, 1));
    else setAnchor((d) => addMonths(d, 1));
  };

  /** Only these three types are shown on the calendar as time blocks. */
  const CALENDAR_DISPLAY_TYPES = ["scheduled_start", "due", "pickup_target"] as const;
  type DisplayEventType = (typeof CALENDAR_DISPLAY_TYPES)[number];

  const EVENT_TYPE_STYLES: Record<DisplayEventType, string> = {
    scheduled_start: "border-l-red-500 bg-red-500/15 hover:bg-red-500/20",
    due: "border-l-orange-500 bg-orange-500/15 hover:bg-orange-500/20",
    pickup_target: "border-l-emerald-500 bg-emerald-500/15 hover:bg-emerald-500/20",
  };

  const calendarEvents = useMemo(
    () => allEvents.filter((e) => CALENDAR_DISPLAY_TYPES.includes(e.type as DisplayEventType)),
    [allEvents]
  );

  const eventsByDateFiltered = useMemo(
    () => groupEventsByDate(calendarEvents),
    [calendarEvents]
  );

  function EventCard({ ev }: { ev: CalendarEvent }) {
    const style = EVENT_TYPE_STYLES[ev.type as DisplayEventType];
    return (
      <div
        className={`block rounded-r-lg border border-wraptors-border border-l-4 p-3 text-left transition-colors ${style ?? "bg-wraptors-charcoal/90"}`}
      >
        <p className="text-sm font-medium text-white truncate">{ev.customerName}</p>
        <p className="text-xs text-wraptors-muted truncate mt-0.5">Job {ev.jobId}</p>
        {ev.time && (
          <p className="text-xs text-wraptors-muted-light mt-0.5">
            {CALENDAR_EVENT_TYPE_LABELS[ev.type]}
            {ev.time ? ` · ${ev.time}` : ""}
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="mt-3 h-8 text-wraptors-gold border-wraptors-gold/50 hover:bg-wraptors-gold/10"
          asChild
        >
          <Link href={`/jobs/${ev.jobId}`}>View job</Link>
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Calendar</h1>
          <p className="text-wraptors-muted mt-0.5">
            Scheduled starts, due dates, and pickup targets. Click &quot;View job&quot; to open job details.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500/80" aria-hidden />
              Scheduled start
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-orange-500/80" aria-hidden />
              Due date
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-500/80" aria-hidden />
              Pickup target
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAnchor(today)}>
            Today
          </Button>
          <div className="flex items-center rounded-lg border border-wraptors-border bg-wraptors-charcoal/50 p-0.5">
            {(["day", "week", "month"] as const).map((v) => (
              <Button
                key={v}
                variant={viewMode === v ? "secondary" : "ghost"}
                size="sm"
                className="capitalize"
                onClick={() => setViewMode(v)}
              >
                {v}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-wraptors-muted-light min-w-[140px] text-center">
              {viewMode === "day"
                ? format(anchor, "EEE, MMM d, yyyy")
                : viewMode === "week"
                  ? `${format(rangeStart, "MMM d")} – ${format(rangeEnd, "MMM d, yyyy")}`
                  : format(anchor, "MMMM yyyy")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="border-wraptors-border bg-wraptors-charcoal/50 border-l-4 border-l-red-500">
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold tabular-nums text-white">{scheduledStartsToday.length}</p>
            <p className="text-xs font-medium text-wraptors-muted mt-0.5">Scheduled start today</p>
            <p className="text-[11px] text-wraptors-muted/80 mt-0.5">Jobs starting today</p>
          </CardContent>
        </Card>
        <Card className="border-wraptors-border bg-wraptors-charcoal/50 border-l-4 border-l-orange-500">
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold tabular-nums text-white">{dueToday.length}</p>
            <p className="text-xs font-medium text-wraptors-muted mt-0.5">Due today</p>
            <p className="text-[11px] text-wraptors-muted/80 mt-0.5">Supposed to be done</p>
          </CardContent>
        </Card>
        <Card className="border-wraptors-border bg-wraptors-charcoal/50 border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold tabular-nums text-white">{pickupTargetsToday.length}</p>
            <p className="text-xs font-medium text-wraptors-muted mt-0.5">Pickup target today</p>
            <p className="text-[11px] text-wraptors-muted/80 mt-0.5">Expected pickups today</p>
          </CardContent>
        </Card>
        <Card className="border-wraptors-border bg-wraptors-charcoal/50">
          <CardContent className="pt-4 pb-4 flex flex-row items-start justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tabular-nums text-white">{unscheduledJobs.length}</p>
              <p className="text-xs font-medium text-wraptors-muted mt-0.5">Unscheduled jobs</p>
              <p className="text-[11px] text-wraptors-muted/80 mt-0.5">Jobs missing technician or schedule</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-wraptors-muted hover:text-wraptors-gold"
              onClick={() => useJobsStore.persist?.rehydrate?.()}
              title="Sync from storage"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        <Card
          className={
            blockedOrAtRiskJobIds.size > 0
              ? "border-amber-500/50 bg-amber-500/5"
              : "border-wraptors-border bg-wraptors-charcoal/50"
          }
        >
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold tabular-nums text-white">{blockedOrAtRiskJobIds.size}</p>
            <p className="text-xs font-medium text-wraptors-muted mt-0.5">Blocked / At risk</p>
            <p className="text-[11px] text-wraptors-muted/80 mt-0.5">
              {blockedOrAtRiskJobIds.size > 0 ? "Jobs needing attention" : "None"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <Card className="border-wraptors-border bg-wraptors-charcoal/30">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-wraptors-muted mr-2">Filters</span>
                <Select value={filterTechnician} onValueChange={setFilterTechnician}>
                  <SelectTrigger className="w-[140px] h-8 border-wraptors-border bg-wraptors-charcoal text-white text-sm">
                    <SelectValue placeholder="Technician" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All technicians</SelectItem>
                    {technicians.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterService} onValueChange={setFilterService}>
                  <SelectTrigger className="w-[120px] h-8 border-wraptors-border bg-wraptors-charcoal text-white text-sm">
                    <SelectValue placeholder="Service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All services</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[110px] h-8 border-wraptors-border bg-wraptors-charcoal text-white text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="intake">Intake</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
                {(filterTechnician !== "all" || filterService !== "all" || filterStatus !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-wraptors-muted hover:text-white"
                    onClick={() => {
                      setFilterTechnician("all");
                      setFilterService("all");
                      setFilterStatus("all");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === "day" && (
                <div className="space-y-3">
                  <p className="text-sm text-wraptors-muted">
                    {format(anchor, "EEEE, MMMM d, yyyy")}
                  </p>
                  <div className="space-y-2">
                    {(eventsByDateFiltered[format(anchor, "yyyy-MM-dd")] ?? []).length === 0 ? (
                      <p className="text-sm text-wraptors-muted py-4">No scheduled start, due date, or pickup target this day.</p>
                    ) : (
                      (eventsByDateFiltered[format(anchor, "yyyy-MM-dd")] ?? []).map((ev) => (
                        <EventCard key={ev.id} ev={ev} />
                      ))
                    )}
                  </div>
                </div>
              )}

              {viewMode === "week" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2 border-b border-wraptors-border pb-2 mb-4">
                    {weekDays.map((d) => (
                      <div key={d.toISOString()} className="text-center">
                        <p className="text-xs text-wraptors-muted">{format(d, "EEE")}</p>
                        <p
                          className={`text-lg font-semibold ${
                            isSameDay(d, today) ? "text-wraptors-gold" : "text-white"
                          }`}
                        >
                          {format(d, "d")}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    {weekDays.map((d) => {
                      const dateStr = format(d, "yyyy-MM-dd");
                      const dayEvents = eventsByDateFiltered[dateStr] ?? [];
                      return (
                        <div key={dateStr} className="flex gap-4 items-start">
                          <div className="w-28 shrink-0 text-sm text-wraptors-muted">
                            {format(d, "EEE, MMM d")}
                          </div>
                          <div className="flex-1 grid gap-2 min-w-0">
                            {dayEvents.length === 0 ? (
                              <span className="text-sm text-wraptors-muted">No events</span>
                            ) : (
                              dayEvents.map((ev) => <EventCard key={ev.id} ev={ev} />)
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewMode === "month" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-px bg-wraptors-border">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <div
                        key={day}
                        className="bg-wraptors-charcoal/50 py-2 text-center text-xs font-medium text-wraptors-muted"
                      >
                        {day}
                      </div>
                    ))}
                    {monthGrid.flat().map((d, i) => {
                      const dateStr = format(d, "yyyy-MM-dd");
                      const dayEvents = eventsByDateFiltered[dateStr] ?? [];
                      const isCurrentMonth = isSameMonth(d, anchor);
                      return (
                        <div
                          key={i}
                          className={`min-h-[100px] p-1.5 border border-wraptors-border/50 ${
                            isCurrentMonth ? "bg-wraptors-charcoal/30" : "bg-wraptors-black/20"
                          }`}
                        >
                          <p
                            className={`text-sm font-medium ${
                              isSameDay(d, today) ? "text-wraptors-gold" : isCurrentMonth ? "text-white" : "text-wraptors-muted/60"
                            }`}
                          >
                            {format(d, "d")}
                          </p>
                          <div className="space-y-1 mt-0.5 overflow-hidden">
                            {dayEvents.slice(0, 4).map((ev) => {
                              const style = EVENT_TYPE_STYLES[ev.type as DisplayEventType];
                              return (
                                <div
                                  key={ev.id}
                                  className={`rounded border-l-2 px-1.5 py-1 text-[10px] truncate ${style ?? "bg-wraptors-charcoal/50"}`}
                                >
                                  <p className="text-white font-medium truncate">{ev.customerName}</p>
                                  <p className="text-wraptors-muted truncate">{ev.jobId}</p>
                                  <Link
                                    href={`/jobs/${ev.jobId}`}
                                    className="text-wraptors-gold hover:underline mt-0.5 inline-block"
                                  >
                                    View job
                                  </Link>
                                </div>
                              );
                            })}
                            {dayEvents.length > 4 && (
                              <span className="text-[10px] text-wraptors-muted">+{dayEvents.length - 4} more</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-80 shrink-0 space-y-5">
          {/* 1. Unscheduled jobs */}
          <Card className="border-wraptors-border bg-wraptors-charcoal/30">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold text-white">
                  Unscheduled jobs
                </CardTitle>
                <p className="text-[11px] text-wraptors-muted mt-0.5">
                  Jobs missing technician or schedule
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-wraptors-muted hover:text-wraptors-gold"
                onClick={() => useJobsStore.persist?.rehydrate?.()}
                title="Sync from storage"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {unscheduledJobs.length === 0 ? (
                <div className="rounded-lg border border-wraptors-border/50 bg-wraptors-black/20 px-3 py-5 text-center">
                  <p className="text-xs text-wraptors-muted">All jobs have a technician and start date.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {unscheduledJobs.slice(0, 8).map((j) => (
                    <li
                      key={j.id}
                      className="flex flex-col gap-1.5 rounded-lg border border-wraptors-border/50 p-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {getCustomerName(j.customerId)}
                        </p>
                        <p className="text-xs text-wraptors-muted">
                          {getVehicleLabel(j.vehicleId)} · {getServiceName(j.serviceId)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-wraptors-gold">
                          Due {j.dueDate ? format(parseISO(j.dueDate), "MMM d") : "—"}
                        </span>
                        {!j.assignedTechnicianId && (
                          <span className="text-[10px] text-amber-400">No tech</span>
                        )}
                        {j.assignedTechnicianId && !j.scheduledStartDate && (
                          <span className="text-[10px] text-wraptors-muted">No start date</span>
                        )}
                      </div>
                      <div className="flex gap-1.5 mt-0.5">
                        <Button variant="outline" size="sm" className="h-7 flex-1" asChild>
                          <Link href={`/jobs/${j.id}`}>Open job</Link>
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 flex-1" asChild>
                          <Link href={`/jobs/${j.id}`}>Schedule</Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* 2. Technician workload */}
          <Card className="border-wraptors-border bg-wraptors-charcoal/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">
                Technician workload
              </CardTitle>
              <p className="text-[11px] text-wraptors-muted mt-0.5">
                Active jobs · due this week
              </p>
            </CardHeader>
            <CardContent>
              {techWorkload.length === 0 ? (
                <p className="text-xs text-wraptors-muted py-2">No technicians with active jobs.</p>
              ) : (
                <ul className="space-y-3">
                  {techWorkload.map((t) => {
                    const maxCount = Math.max(...techWorkload.map((x) => x.count), 1);
                    return (
                      <li key={t.id} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{t.name}</p>
                          <div className="mt-1 h-1.5 rounded-full bg-wraptors-black/50 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-wraptors-gold/60 transition-all"
                              style={{ width: `${(t.count / maxCount) * 100}%` }}
                            />
                          </div>
                          {t.dueThisWeek > 0 && (
                            <p className="text-[10px] text-wraptors-muted mt-0.5">
                              {t.dueThisWeek} due this week
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-wraptors-gold shrink-0 w-6 text-right">
                          {t.count}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* 3. Upcoming pickups */}
          <Card className="border-wraptors-border bg-wraptors-charcoal/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">
                Upcoming pickups
              </CardTitle>
              <p className="text-[11px] text-wraptors-muted mt-0.5">
                Ready for customer handoff
              </p>
            </CardHeader>
            <CardContent>
              {upcomingPickups.length === 0 ? (
                <p className="text-xs text-wraptors-muted py-2">No pickups in the next 7 days.</p>
              ) : (
                <ul className="space-y-2">
                  {upcomingPickups.map((ev) => {
                    const job = filteredJobs.find((j) => j.id === ev.jobId);
                    const stageLabel = job?.stage === "ready" ? "Ready" : job?.completedAt ? "Completed" : job?.stage ?? null;
                    return (
                      <li key={ev.id}>
                        <Link
                          href={`/jobs/${ev.jobId}`}
                          className="flex flex-col gap-0.5 rounded-lg border border-wraptors-border/50 p-2.5 hover:border-wraptors-gold/50 hover:bg-wraptors-charcoal/50 transition-colors"
                        >
                          <p className="text-sm font-medium text-white truncate">{ev.customerName}</p>
                          <p className="text-xs text-wraptors-muted truncate">{ev.vehicleLabel}</p>
                          <p className="text-xs text-wraptors-gold font-medium">
                            {format(parseISO(ev.date), "MMM d")}
                            {ev.time ? ` · ${ev.time}` : ""}
                          </p>
                          {stageLabel && (
                            <span className="text-[10px] text-wraptors-muted capitalize">{stageLabel}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
