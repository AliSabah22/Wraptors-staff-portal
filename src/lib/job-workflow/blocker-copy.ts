/**
 * Central copy and labels for the blocker workflow.
 * Single source of truth for modals, banner, timeline, chat, and notifications.
 */

import type { BlockTypeKey, OperationalBlockRequest, BlockRequestDetails } from "@/types";
import { BLOCK_TYPE_LABELS } from "./config";
import { PAYMENT_STAGE_OPTIONS, MATERIAL_ISSUE_OPTIONS, REWORK_REASON_OPTIONS } from "./config";

// ----- Modal: block request -----

export const BLOCK_MODAL_TITLES: Record<BlockTypeKey, string> = {
  waiting_for_parts: "Request block — Waiting for parts",
  waiting_for_approval: "Request approval",
  waiting_for_payment: "Request block — Waiting for payment",
  material_issue: "Report material issue",
  rework_needed: "Request block — Rework needed",
};

export const BLOCK_MODAL_DESCRIPTIONS: Record<BlockTypeKey, string> = {
  waiting_for_parts:
    "Operations will be notified to coordinate parts. Provide details so they can track and resolve.",
  waiting_for_approval:
    "CEO will be notified to approve or deny. Your reason will be visible to leadership.",
  waiting_for_payment:
    "Operations and leadership will be notified. Specify which payment is holding the job.",
  material_issue:
    "Operations and leadership will be notified. Describe the issue so they can resolve or reorder.",
  rework_needed:
    "Operations and leadership will be notified. Specify the reason so they can coordinate.",
};

// ----- Banner: resolution action button labels -----

export const RESOLUTION_BUTTON_LABELS: Record<Exclude<BlockTypeKey, "waiting_for_approval">, string> = {
  waiting_for_parts: "Mark parts received",
  waiting_for_payment: "Confirm payment received",
  material_issue: "Mark issue resolved",
  rework_needed: "Approve rework / resolve",
};

// ----- Timeline: activity log entry labels -----

export function getTimelineLabel(
  kind: "blocker_requested" | "blocker_resolved" | "approval_approved" | "approval_denied",
  blockType: BlockTypeKey,
  options: { requestedByName?: string; resolvedByName?: string; denialReason?: string }
): string {
  const typeLabel = BLOCK_TYPE_LABELS[blockType];
  switch (kind) {
    case "blocker_requested":
      return options.requestedByName
        ? `Block requested — ${typeLabel} (by ${options.requestedByName})`
        : `Block requested — ${typeLabel}`;
    case "blocker_resolved":
      return options.resolvedByName
        ? `Block resolved (by ${options.resolvedByName})`
        : "Block resolved";
    case "approval_approved":
      return options.resolvedByName
        ? `Approval approved (by ${options.resolvedByName})`
        : "Approval approved";
    case "approval_denied":
      const base = options.resolvedByName
        ? `Approval denied (by ${options.resolvedByName})`
        : "Approval denied";
      return options.denialReason ? `${base} — ${options.denialReason}` : base;
    default:
      return "Block event";
  }
}

// ----- Chat: system message bodies -----

/** Format detail value for display (e.g. payment_stage -> "payment stage"). */
function formatDetailValue(value: string): string {
  return value.replace(/_/g, " ");
}

/** Build one-line summary of request details for chat. */
export function getBlockRequestDetailSummary(details: BlockRequestDetails): string {
  switch (details.type) {
    case "waiting_for_parts":
      const parts = [details.partName];
      if (details.estimatedArrival) parts.push(`ETA: ${details.estimatedArrival}`);
      return parts.join(" · ");
    case "waiting_for_approval":
      return details.requestReason;
    case "waiting_for_payment":
      return formatDetailValue(details.paymentStage);
    case "material_issue":
      return formatDetailValue(details.issueType);
    case "rework_needed":
      return formatDetailValue(details.reworkReason);
    default:
      return "";
  }
}

export function getChatSystemMessageRequested(
  requestedByName: string,
  blockType: BlockTypeKey,
  details: BlockRequestDetails
): string {
  const typeLabel = BLOCK_TYPE_LABELS[blockType];
  const summary = getBlockRequestDetailSummary(details);
  if (blockType === "waiting_for_approval") {
    return `${requestedByName} requested approval from CEO. Reason: ${summary}`;
  }
  return summary
    ? `${requestedByName} blocked the job — ${typeLabel}. ${summary}`
    : `${requestedByName} blocked the job — ${typeLabel}`;
}

export const CHAT_SYSTEM_MESSAGE_RESOLVED: Record<Exclude<BlockTypeKey, "waiting_for_approval">, string> = {
  waiting_for_parts: "Parts received — job unblocked by operations.",
  waiting_for_payment: "Payment confirmed — job unblocked.",
  material_issue: "Material issue marked resolved — job unblocked.",
  rework_needed: "Rework approved — job unblocked.",
};

export function getChatSystemMessageApprovalApproved(resolvedByName: string): string {
  return `Approval request approved by ${resolvedByName}. Job unblocked.`;
}

export function getChatSystemMessageApprovalDenied(denialReason: string, resolvedByName: string): string {
  return `Approval request denied by ${resolvedByName}. Reason: ${denialReason}`;
}

// ----- Banner: detail row label for each block type -----

export function getBannerDetailLabel(type: BlockTypeKey): string {
  switch (type) {
    case "waiting_for_parts":
      return "Part";
    case "waiting_for_approval":
      return "Reason";
    case "waiting_for_payment":
      return "Payment stage";
    case "material_issue":
      return "Issue";
    case "rework_needed":
      return "Rework reason";
    default:
      return "Details";
  }
}

export function getBannerDetailValue(request: OperationalBlockRequest): string {
  const d = request.details;
  switch (request.type) {
    case "waiting_for_parts":
      return "partName" in d ? d.partName : "";
    case "waiting_for_approval":
      return "requestReason" in d ? d.requestReason : "";
    case "waiting_for_payment":
      return "paymentStage" in d ? getPaymentStageLabel(d.paymentStage) : "";
    case "material_issue":
      return "issueType" in d ? getMaterialIssueLabel(d.issueType) : "";
    case "rework_needed":
      return "reworkReason" in d ? getReworkReasonLabel(d.reworkReason) : "";
    default:
      return "";
  }
}

/** Optional second line for banner (e.g. ETA, supplier). */
export function getBannerDetailSubline(request: OperationalBlockRequest): string | null {
  const d = request.details;
  if (request.type === "waiting_for_parts" && "estimatedArrival" in d && d.estimatedArrival) {
    const parts = [`ETA: ${d.estimatedArrival}`];
    if ("supplier" in d && d.supplier) parts.push(d.supplier);
    return parts.join(" · ");
  }
  return null;
}

// ----- Human-readable option labels (for banner when showing raw value) -----

export function getPaymentStageLabel(value: string): string {
  return PAYMENT_STAGE_OPTIONS.find((o) => o.value === value)?.label ?? formatDetailValue(value);
}

export function getMaterialIssueLabel(value: string): string {
  return MATERIAL_ISSUE_OPTIONS.find((o) => o.value === value)?.label ?? formatDetailValue(value);
}

export function getReworkReasonLabel(value: string): string {
  return REWORK_REASON_OPTIONS.find((o) => o.value === value)?.label ?? formatDetailValue(value);
}
