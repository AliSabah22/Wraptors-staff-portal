// TODO: HARDCODED DATA — MIGRATION IN PROGRESS
// This file is being replaced by lib/data/* Supabase query modules.
// DO NOT DELETE until Supabase is confirmed working in production.

import type { MetaLeadSubmissionPayload } from "@/types";

/** Demo Meta pages for Settings dropdown. */
export const META_PAGES = [
  { id: "page_wraptors", name: "Wraptors Inc." },
  { id: "page_wraptors_leads", name: "Wraptors Leads" },
] as const;

/** Demo Meta lead forms for Settings multi-select. */
export const META_FORMS = [
  { id: "form_wrap_quote", name: "Wrap Quote Form" },
  { id: "form_ppf_inquiry", name: "PPF Inquiry Form" },
  { id: "form_ceramic_lead", name: "Ceramic Coating Lead Form" },
] as const;

/** Sample Meta lead submissions for "Simulate incoming Meta lead" demo. */
export const MOCK_META_LEAD_SUBMISSIONS: MetaLeadSubmissionPayload[] = [
  {
    externalLeadId: `meta_${Date.now()}_1`,
    formName: "Wrap Quote Form",
    fullName: "John Smith",
    phone: "+1 (415) 555-0123",
    email: "john.smith@email.com",
    answers: "Full color change wrap for Tesla Model 3",
    submittedAt: new Date().toISOString(),
    pageName: "Wraptors Inc.",
  },
  {
    externalLeadId: `meta_${Date.now()}_2`,
    formName: "PPF Inquiry Form",
    fullName: "Sarah Khan",
    phone: "+1 (415) 555-0456",
    email: "sarah.khan@email.com",
    answers: "Front-end PPF for BMW M4",
    submittedAt: new Date().toISOString(),
    pageName: "Wraptors Inc.",
  },
  {
    externalLeadId: `meta_${Date.now()}_3`,
    formName: "Ceramic Coating Lead Form",
    fullName: "Michael Rossi",
    phone: "+1 (415) 555-0789",
    email: "michael.rossi@email.com",
    answers: "Ceramic coating for Porsche 911",
    submittedAt: new Date().toISOString(),
    pageName: "Wraptors Leads",
  },
];

/** Return a copy of a mock submission with a unique externalLeadId and submittedAt. */
export function getNextMockMetaLead(index: number): MetaLeadSubmissionPayload {
  const templates: Omit<MetaLeadSubmissionPayload, "externalLeadId" | "submittedAt">[] = [
    {
      formName: "Wrap Quote Form",
      fullName: "John Smith",
      phone: "+1 (415) 555-0123",
      email: "john.smith@email.com",
      answers: "Full color change wrap for Tesla Model 3",
      pageName: "Wraptors Inc.",
    },
    {
      formName: "PPF Inquiry Form",
      fullName: "Sarah Khan",
      phone: "+1 (415) 555-0456",
      email: "sarah.khan@email.com",
      answers: "Front-end PPF for BMW M4",
      pageName: "Wraptors Inc.",
    },
    {
      formName: "Ceramic Coating Lead Form",
      fullName: "Michael Rossi",
      phone: "+1 (415) 555-0789",
      email: "michael.rossi@email.com",
      answers: "Ceramic coating for Porsche 911",
      pageName: "Wraptors Leads",
    },
  ];
  const t = templates[index % templates.length];
  const now = new Date().toISOString();
  return {
    ...t,
    externalLeadId: `meta_${Date.now()}_${index}`,
    submittedAt: now,
  };
}
