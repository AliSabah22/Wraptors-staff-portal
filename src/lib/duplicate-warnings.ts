/**
 * Centralized duplicate detection for create flows.
 * Used by Add Customer (and optionally Add Vehicle / Create Quote).
 */

import type { Customer } from "@/types";

export interface DuplicateCandidate {
  id: string;
  name: string;
}

/**
 * Check for an existing customer with the same phone or email.
 * Returns the first match or null.
 */
export function checkDuplicateCustomer(
  customers: Customer[],
  data: { phone: string; email?: string }
): DuplicateCandidate | null {
  const phone = data.phone.trim();
  const email = data.email?.trim();
  const match = customers.find(
    (c) =>
      c.phone === phone ||
      (email && c.email && c.email.toLowerCase() === email.toLowerCase())
  );
  return match ? { id: match.id, name: match.name } : null;
}
