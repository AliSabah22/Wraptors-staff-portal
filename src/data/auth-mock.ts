// TODO: HARDCODED DATA — MIGRATION IN PROGRESS
// This file is being replaced by lib/data/* Supabase query modules.
// DO NOT DELETE until Supabase is confirmed working in production.

/**
 * Mock auth data for MVP.
 * Replace with real auth (Supabase, NextAuth, etc.) when backend is ready.
 */

import type { StaffUser } from "@/types";
import { normalizeRole } from "@/lib/auth/roles";

/** MVP: single shared password for all seeded accounts. Do not use in production. */
export const MOCK_STAFF_PASSWORD = "wraptors2024";

export interface StaffCredential {
  user: StaffUser;
  /** Plain password for mock only. */
  password: string;
}

const staffByEmail: Map<string, StaffCredential> = new Map();

export function registerMockStaff(cred: StaffCredential): void {
  staffByEmail.set(cred.user.email.toLowerCase(), cred);
}

export function getMockStaffByEmail(email: string): StaffCredential | undefined {
  return staffByEmail.get(email.toLowerCase().trim());
}

export function mockLogin(
  email: string,
  password: string
): { user: StaffUser; role: string } | null {
  const cred = getMockStaffByEmail(email);
  if (!cred || cred.password !== password) return null;
  const role = normalizeRole(cred.user.role);
  return { user: { ...cred.user, role } as StaffUser, role };
}
