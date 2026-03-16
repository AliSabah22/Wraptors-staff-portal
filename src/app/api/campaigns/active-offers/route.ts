import { NextResponse } from "next/server";

/**
 * Placeholder: returns active in-app campaigns for the Flutter app.
 * TODO: Add auth for the Flutter app (e.g. API key or session).
 * TODO: Replace with real data source when persistence is wired.
 * For now we cannot access Zustand from a Route Handler — this would need
 * to read from DB or a server-side store. Return empty array as placeholder.
 */
export async function GET() {
  // In a real implementation: fetch active campaigns where channels.in_app === true
  // from your database or server-side store.
  const offers: unknown[] = [];
  return NextResponse.json({ offers });
}
