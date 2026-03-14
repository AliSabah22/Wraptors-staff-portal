import { create } from "zustand";
import type { PipelineLead, PipelineStage, QuoteStatus } from "@/types";
import { mockPipeline } from "@/data/mock";
import { useQuotesStore } from "./quotes";

/** Map pipeline stage to quote request status for syncing Quote Requests tab */
const pipelineStageToQuoteStatus: Record<PipelineStage, QuoteStatus> = {
  lead: "new",
  consultation: "contacted",
  quote_sent: "quoted",
  follow_up: "negotiating",
  booked: "booked",
  lost: "lost",
};

interface PipelineState {
  leads: PipelineLead[];
  setLeads: (leads: PipelineLead[]) => void;
  getLeadById: (id: string) => PipelineLead | undefined;
  updateLeadStage: (id: string, stage: PipelineStage) => void;
  addLead: (lead: PipelineLead) => void;
  updateLead: (id: string, data: Partial<PipelineLead>) => void;
  removeLeadsByCustomerId: (customerId: string) => void;
  removeLead: (leadId: string) => void;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  leads: mockPipeline,

  setLeads: (leads) => set({ leads }),

  getLeadById: (id) => get().leads.find((l) => l.id === id),

  updateLeadStage: (id, stage) => {
    const lead = get().leads.find((l) => l.id === id);
    if (lead?.quoteRequestId) {
      const quoteStatus = pipelineStageToQuoteStatus[stage];
      useQuotesStore.getState().updateQuoteStatus(lead.quoteRequestId, quoteStatus);
    }
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === id ? { ...l, stage, updatedAt: new Date().toISOString() } : l
      ),
    }));
  },

  addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),

  updateLead: (id, data) =>
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === id ? { ...l, ...data, updatedAt: new Date().toISOString() } : l
      ),
    })),

  removeLeadsByCustomerId: (customerId) =>
    set((state) => ({
      leads: state.leads.filter((l) => l.customerId !== customerId),
    })),

  removeLead: (leadId) =>
    set((state) => ({
      leads: state.leads.filter((l) => l.id !== leadId),
    })),
}));
