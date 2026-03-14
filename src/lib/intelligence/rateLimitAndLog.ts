/**
 * In-memory rate limit and query log for Intelligence API (demo).
 * POST-LAUNCH: Replace with Redis/DB-backed rate limit and persistence.
 */

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 30;

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string): { allowed: boolean; retryAfterMinutes?: number } {
  const now = Date.now();
  const entry = requestCounts.get(userId);
  if (!entry) {
    requestCounts.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  if (now >= entry.resetAt) {
    requestCounts.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfterMinutes = Math.ceil((entry.resetAt - now) / 60000);
    return { allowed: false, retryAfterMinutes };
  }
  entry.count += 1;
  return { allowed: true };
}

export interface IntelligenceQueryLogEntry {
  id: string;
  user_id: string;
  message_preview: string;
  context_modules_used: string[];
  response_time_ms: number;
  created_at: string;
}

const queryLog: IntelligenceQueryLogEntry[] = [];

export function appendQueryLog(entry: Omit<IntelligenceQueryLogEntry, "id" | "created_at">): void {
  queryLog.push({
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    created_at: new Date().toISOString(),
  });
}

export function getQueryLog(): IntelligenceQueryLogEntry[] {
  return [...queryLog];
}
