/**
 * Smart Quote Builder — access control.
 * Technicians have zero access; CEO and Receptionist only.
 */

import type { StaffRoleCode } from "@/lib/auth/roles";
import { normalizeRole } from "@/lib/auth/roles";

const QUOTE_ACCESS_ERROR = "QUOTE_ACCESS_FORBIDDEN";

export class QuoteAccessForbiddenError extends Error {
  constructor() {
    super("You do not have access to the Quote Builder.");
    this.name = QUOTE_ACCESS_ERROR;
  }
}

export function requireQuoteAccess(role: StaffRoleCode | string | undefined): void {
  const code = role ? normalizeRole(role) : "technician";
  if (code === "technician") {
    throw new QuoteAccessForbiddenError();
  }
}

export function requireCeoOnly(role: StaffRoleCode | string | undefined): void {
  const code = role ? normalizeRole(role) : "technician";
  if (code !== "ceo") {
    throw new QuoteAccessForbiddenError();
  }
}

export function canAccessQuotes(role: StaffRoleCode | string | undefined): boolean {
  const code = role ? normalizeRole(role) : "technician";
  return code === "ceo" || code === "receptionist";
}

export function canApproveDiscount(role: StaffRoleCode | string | undefined): boolean {
  const code = role ? normalizeRole(role) : "technician";
  return code === "ceo";
}

export function canViewQuoteStats(role: StaffRoleCode | string | undefined): boolean {
  const code = role ? normalizeRole(role) : "technician";
  return code === "ceo";
}
