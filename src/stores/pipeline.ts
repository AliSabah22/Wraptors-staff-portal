import { create } from "zustand";
import type { PipelineLead, PipelineStage, QuoteStatus } from "@/types";
import { useQuotesStore } from "./quotes";

function isPipelineStage(s: string): s is PipelineStage {
  return (
    s === "lead" ||
    s === "consultation" ||
    s === "quote_sent" ||
    s === "follow_up" ||
    s === "booked" ||
    s === "lost"
  );
}

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
  /** `newStage` is either a legacy `PipelineStage` or a Supabase `pipeline_stages` UUID. */
  updateLeadStage: (id: string, newStage: PipelineStage | string) => void;
  addLead: (lead: PipelineLead) => void;
  updateLead: (id: string, data: Partial<PipelineLead>) => void;
  removeLeadsByCustomerId: (customerId: string) => void;
  removeLead: (leadId: string) => void;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  leads: [],

  setLeads: (leads) => set({ leads }),

  getLeadById: (id) => get().leads.find((l) => l.id === id),

  updateLeadStage: (id, newStage) => {
    const lead = get().leads.find((l) => l.id === id);
    if (lead?.quoteRequestId && isPipelineStage(newStage)) {
      const quoteStatus = pipelineStageToQuoteStatus[newStage];
      useQuotesStore.getState().updateQuoteStatus(lead.quoteRequestId, quoteStatus);
    }
    set((state) => ({
      leads: state.leads.map((l) => {
        if (l.id !== id) return l;
        const updatedAt = new Date().toISOString();
        if (isPipelineStage(newStage)) {
          return {
            ...l,
            stage: newStage,
            pipelineColumnId: undefined,
            updatedAt,
          };
        }
        return {
          ...l,
          pipelineColumnId: newStage,
          updatedAt,
        };
      }),
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
