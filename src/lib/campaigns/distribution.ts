/**
 * Campaign distribution helpers — DEMO ONLY.
 * Real email/SMS/push and audience resolution to be wired later.
 */

import type { CampaignChannels, CampaignAudienceType } from "@/types";

/** Mock: resolve audience segment to a count. TODO: wire to real customer/user queries. */
export function resolveAudienceSegment(
  audienceType: CampaignAudienceType,
  _params: Record<string, unknown> | null
): number {
  const mockCounts: Record<CampaignAudienceType, number> = {
    all_users: 847,
    all_customers: 612,
    previous_customers: 428,
    members_only: 124,
    service_history: 380,
    manual: 0,
  };
  return mockCounts[audienceType] ?? 0;
}

/**
 * Mock: send campaign via email. TODO: wire to real email provider (SendGrid, Resend, etc.).
 */
export function sendCampaignEmail(
  _campaignId: string,
  _recipientIds: string[],
  _subject: string,
  _bodyHtml: string
): number {
  return _recipientIds.length;
}

/**
 * Mock: send campaign via SMS. TODO: wire to real SMS provider (Twilio, etc.).
 */
export function sendCampaignSMS(
  _campaignId: string,
  _recipientIds: string[],
  _message: string
): number {
  return _recipientIds.length;
}

/**
 * Mock: send campaign as in-app push. TODO: wire to real push (FCM, APNs, OneSignal, etc.).
 */
export function sendCampaignPush(
  _campaignId: string,
  _recipientIds: string[],
  _title: string,
  _body: string
): number {
  return _recipientIds.length;
}
