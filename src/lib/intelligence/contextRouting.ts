/**
 * Determines which analytics context modules to fetch based on message content.
 */

export type ContextModule =
  | "revenue"
  | "jobs"
  | "pipeline"
  | "quotes"
  | "technician"
  | "customer"
  | "calendar";

const REVENUE_KEYWORDS = [
  "revenue",
  "money",
  "profit",
  "income",
  "earnings",
  "revenue",
  "total sales",
  "how much",
  "bringing in",
];
const JOBS_KEYWORDS = [
  "job",
  "jobs",
  "work",
  "stage",
  "blocked",
  "overdue",
  "completion",
  "completed",
  "intake",
  "installation",
  "scheduled",
];
const PIPELINE_KEYWORDS = [
  "lead",
  "leads",
  "pipeline",
  "conversion",
  "lost",
  "source",
  "stale",
];
const QUOTES_KEYWORDS = [
  "quote",
  "quotes",
  "acceptance",
  "sent",
  "declined",
  "expiring",
];
const TECHNICIAN_KEYWORDS = [
  "technician",
  "tech",
  "staff",
  "team",
  "morgan",
  "jordan",
  "performance",
  "utilization",
  "blocked",
];
const CUSTOMER_KEYWORDS = [
  "customer",
  "customers",
  "client",
  "returning",
  "inactive",
  "lifetime",
  "dormant",
];
const CALENDAR_KEYWORDS = [
  "schedule",
  "calendar",
  "week",
  "today",
  "dropoff",
  "drop-off",
  "pickup",
  "pick-up",
  "unscheduled",
];
const GENERAL_KEYWORDS = [
  "how is",
  "overview",
  "summary",
  "business",
  "performing",
  "doing",
  "everything",
  "all",
];

export function getContextModulesForMessage(message: string): ContextModule[] {
  const lower = message.toLowerCase().trim();
  const modules: Set<ContextModule> = new Set();

  const check = (keywords: string[]) => keywords.some((k) => lower.includes(k));

  if (check(GENERAL_KEYWORDS) && (lower.includes("business") || lower.includes("overview") || lower.length < 30)) {
    return ["revenue", "jobs", "pipeline", "quotes", "technician", "customer", "calendar"];
  }

  if (check(REVENUE_KEYWORDS)) modules.add("revenue");
  if (check(JOBS_KEYWORDS)) modules.add("jobs");
  if (check(PIPELINE_KEYWORDS)) modules.add("pipeline");
  if (check(QUOTES_KEYWORDS)) modules.add("quotes");
  if (check(TECHNICIAN_KEYWORDS)) modules.add("technician");
  if (check(CUSTOMER_KEYWORDS)) modules.add("customer");
  if (check(CALENDAR_KEYWORDS)) modules.add("calendar");

  if (modules.size === 0) {
    return ["revenue", "jobs", "pipeline", "quotes", "technician", "customer", "calendar"];
  }
  return Array.from(modules);
}
