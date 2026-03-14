"use client";

import { DashboardPage } from "./dashboard-page";

/** Static import to avoid ChunkLoadError on nav. Use this or import DashboardPage directly. */
export function DashboardPageClient() {
  return <DashboardPage />;
}
