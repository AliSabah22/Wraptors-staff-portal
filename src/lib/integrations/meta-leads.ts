/**
 * Meta Lead Ads → Pipeline ingestion.
 * Demo-ready: maps Meta lead payload to PipelineLead and builds receptionist notification.
 * Replace with real webhook/API when backend is ready.
 */

import type { PipelineLead, MetaLeadSubmissionPayload } from "@/types";
import type { StaffUser } from "@/types";
import { PIPELINE_LEAD_SOURCE_META } from "@/types";
import { SHOP_ID } from "@/lib/constants";

/** Map Meta lead payload to internal Pipeline lead. Stage is always "lead". */
export function metaLeadToPipelineLead(
  payload: MetaLeadSubmissionPayload,
  shopId: string = SHOP_ID
): Omit<PipelineLead, "id"> {
  const now = new Date().toISOString();
  const contact = payload.phone ?? payload.email ?? "";
  const notes = payload.answers
    ? `Form: ${payload.formName}\n${payload.answers}`
    : `Form: ${payload.formName}`;
  return {
    shopId,
    name: payload.fullName.trim(),
    contact: contact.trim() || "—",
    stage: "lead",
    notes: notes.trim() || undefined,
    source: PIPELINE_LEAD_SOURCE_META,
    formName: payload.formName,
    externalLeadId: payload.externalLeadId,
    createdAt: payload.submittedAt || now,
    updatedAt: now,
  };
}

/** Create pipeline lead from Meta payload, add to store, notify receptionist. Returns the created lead. */
export function ingestMetaLeadIntoPipeline(
  payload: MetaLeadSubmissionPayload,
  deps: {
    addLead: (lead: PipelineLead) => void;
    addNotification: (item: { shopId: string; userId: string; type: "meta_lead"; title: string; message: string; read: boolean; link: string; createdAt: string }) => void;
    getReceptionistUserId: (staff: StaffUser[]) => string | null;
    teamMembers: StaffUser[];
  }
): PipelineLead {
  const partial = metaLeadToPipelineLead(payload);
  const lead: PipelineLead = {
    ...partial,
    id: `lead_meta_${Date.now()}`,
  };
  deps.addLead(lead);
  const receptionistId = deps.getReceptionistUserId(deps.teamMembers);
  if (receptionistId) {
    deps.addNotification(buildMetaLeadNotification(lead.name, lead.formName ?? payload.formName, lead.id, receptionistId));
  }
  return lead;
}

/** Resolve receptionist user ID for notifications (first receptionist in team). */
export function getReceptionistUserId(staff: StaffUser[]): string | null {
  const r = staff.find(
    (s) => s.role.toLowerCase() === "receptionist" || s.role.toLowerCase() === "sales_manager"
  );
  return r?.id ?? null;
}

/** Build notification item for new Meta lead (receptionist). */
export function buildMetaLeadNotification(
  leadName: string,
  formName: string,
  leadId: string,
  userId: string
): {
  shopId: string;
  userId: string;
  type: "meta_lead";
  title: string;
  message: string;
  read: boolean;
  link: string;
  createdAt: string;
} {
  return {
    shopId: SHOP_ID,
    userId,
    type: "meta_lead",
    title: "New Meta lead received",
    message: `${leadName} · ${formName}`,
    read: false,
    link: `/pipeline`,
    createdAt: new Date().toISOString(),
  };
}
