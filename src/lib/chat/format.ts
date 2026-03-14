/**
 * Chat display formatting: relative time, thread preview, job context.
 * Keeps copy and hierarchy consistent across thread list, headers, and notifications.
 */

export function formatChatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 864e5).toDateString();
  const dateStr = d.toDateString();

  if (dateStr === today) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  if (dateStr === yesterday) return "Yesterday";
  if (now.getTime() - d.getTime() < 7 * 864e5) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Short preview for thread list: strip leading @mentions for display if desired, cap length. */
export function threadPreview(body: string, maxLen = 52): string {
  const t = body.trim();
  if (!t) return "";
  return t.length <= maxLen ? t : t.slice(0, maxLen).trim() + "…";
}

/** Build job-context thread title: "Vehicle · Service" for display in lists and headers. */
export function jobThreadTitle(vehicleMake?: string, vehicleModel?: string, serviceName?: string): string {
  const vehicle = [vehicleMake, vehicleModel].filter(Boolean).join(" ");
  const parts = [vehicle, serviceName].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Job thread";
}
