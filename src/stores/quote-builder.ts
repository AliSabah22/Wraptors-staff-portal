/**
 * Smart Quote Builder store.
 * Access: CEO and Receptionist only. Technicians get QuoteAccessForbiddenError.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  QuoteTemplate,
  VehicleClassMultiplier,
  QuoteAddon,
  SmartQuote,
  QuoteLineItem,
  QuoteFollowUp,
  QuoteTier,
  VehicleSnapshot,
  ServiceJob,
} from "@/types";
import { STAGE_PROGRESS } from "@/types";
import { SHOP_ID } from "@/lib/constants";
import { useAuthStore } from "./auth";
import { useJobsStore } from "./jobs";
import { useVehiclesStore } from "./vehicles";
import { requireQuoteAccess, requireCeoOnly, canApproveDiscount, canViewQuoteStats } from "@/lib/quote-builder/access";
import { nextQuoteNumber } from "@/lib/quote-builder/quote-number";
import {
  seedQuoteTemplates,
  seedVehicleClassMultipliers,
  seedQuoteAddons,
  seedSmartQuotes,
  seedQuoteLineItems,
  seedQuoteFollowUps,
} from "@/data/quote-builder-seed";

const DISCOUNT_APPROVAL_THRESHOLD = 0.15;

export interface QuoteListFilters {
  status?: SmartQuote["status"];
  createdBy?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface QuoteListResult {
  items: SmartQuote[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateQuotePayload {
  customerId: string | null;
  pipelineLeadId: string | null;
  vehicleId: string | null;
  vehicleSnapshot: VehicleSnapshot | null;
  vehicleClassMultiplierId: string;
  createdByUserId: string;
  notes: string | null;
  validUntil: string;
  lineItems: Array<
    | { type: "service"; quoteTemplateId: string; tier: QuoteTier }
    | { type: "addon"; quoteAddonId: string }
  >;
  discountAmount?: number;
}

export interface UpdateQuotePayload {
  notes?: string | null;
  validUntil?: string;
  vehicleClassMultiplierId?: string;
  discountAmount?: number;
  lineItems?: CreateQuotePayload["lineItems"];
}

function getRole(): string | undefined {
  return useAuthStore.getState().user?.role;
}

interface QuoteBuilderState {
  quoteTemplates: QuoteTemplate[];
  vehicleClassMultipliers: VehicleClassMultiplier[];
  quoteAddons: QuoteAddon[];
  quotes: SmartQuote[];
  quoteLineItems: QuoteLineItem[];
  quoteFollowUps: QuoteFollowUp[];
}

interface QuoteBuilderActions {
  getTemplates: () => QuoteTemplate[];
  getMultipliers: () => VehicleClassMultiplier[];
  getAddons: () => QuoteAddon[];
  getQuotes: (filters?: QuoteListFilters, page?: number, pageSize?: number) => QuoteListResult;
  getQuoteById: (id: string) => SmartQuote | undefined;
  getLineItemsByQuoteId: (quoteId: string) => QuoteLineItem[];
  getFollowUpsByQuoteId: (quoteId: string) => QuoteFollowUp[];
  createQuote: (payload: CreateQuotePayload) => SmartQuote;
  updateQuote: (id: string, payload: UpdateQuotePayload) => SmartQuote | null;
  sendQuote: (id: string) => SmartQuote | null;
  acceptQuote: (id: string, selectedTier: QuoteTier) => SmartQuote | null;
  declineQuote: (id: string) => SmartQuote | null;
  approveDiscount: (id: string) => SmartQuote | null;
  convertToJob: (id: string) => { jobId: string; quoteId: string } | null;
  getStats: () => {
    totalQuotesSent: number;
    sentThisMonth: number;
    acceptanceRate: number;
    averageQuoteValue: number;
    quotesByStatus: Record<SmartQuote["status"], number>;
    topServicesQuoted: Array<{ templateId: string; label: string; count: number }>;
  };
}

function buildLineItems(
  quoteId: string,
  multiplier: number,
  payload: CreateQuotePayload,
  templates: QuoteTemplate[],
  addons: QuoteAddon[]
): QuoteLineItem[] {
  const now = new Date().toISOString();
  const items: QuoteLineItem[] = [];
  let idx = 0;
  for (const li of payload.lineItems) {
    if (li.type === "service") {
      const t = templates.find((x) => x.id === li.quoteTemplateId);
      if (!t) continue;
      const basePrice = t.basePrice;
      const finalPrice = Math.round(basePrice * multiplier * 100) / 100;
      items.push({
        id: `qli_${quoteId}_${idx++}_${Date.now()}`,
        quoteId,
        type: "service",
        quoteTemplateId: t.id,
        quoteAddonId: null,
        tier: li.tier,
        label: `${t.name} (${li.tier.charAt(0).toUpperCase() + li.tier.slice(1)})`,
        basePrice,
        multiplierApplied: multiplier,
        finalPrice,
        createdAt: now,
      });
    } else {
      const a = addons.find((x) => x.id === li.quoteAddonId);
      if (!a) continue;
      const mult = a.isVehicleAdjusted ? multiplier : 1;
      const finalPrice = Math.round(a.basePrice * mult * 100) / 100;
      items.push({
        id: `qli_${quoteId}_${idx++}_${Date.now()}`,
        quoteId,
        type: "addon",
        quoteTemplateId: null,
        quoteAddonId: a.id,
        tier: null,
        label: a.name,
        basePrice: a.basePrice,
        multiplierApplied: mult,
        finalPrice,
        createdAt: now,
      });
    }
  }
  return items;
}

function recalcTotals(
  lineItems: QuoteLineItem[],
  discountAmount: number
): { subtotal: number; total: number; discountRequiresApproval: boolean } {
  const subtotal = lineItems.reduce((s, li) => s + li.finalPrice, 0);
  const total = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
  const discountRequiresApproval =
    subtotal > 0 && discountAmount > 0 && discountAmount / subtotal > DISCOUNT_APPROVAL_THRESHOLD;
  return { subtotal, total, discountRequiresApproval };
}

export type QuoteBuilderStore = QuoteBuilderState & QuoteBuilderActions;

const initialQuotes = seedSmartQuotes;
const initialLineItems = seedQuoteLineItems;
const initialFollowUps = seedQuoteFollowUps;

export const useQuoteBuilderStore = create<QuoteBuilderStore>()(
  persist(
    (set, get) => ({
      quoteTemplates: seedQuoteTemplates,
      vehicleClassMultipliers: seedVehicleClassMultipliers,
      quoteAddons: seedQuoteAddons,
      quotes: initialQuotes,
      quoteLineItems: initialLineItems,
      quoteFollowUps: initialFollowUps,

      getTemplates: () => {
        requireQuoteAccess(getRole());
        return get().quoteTemplates.filter((t) => t.isActive);
      },

      getMultipliers: () => {
        requireQuoteAccess(getRole());
        return get().vehicleClassMultipliers;
      },

      getAddons: () => {
        requireQuoteAccess(getRole());
        return get().quoteAddons.filter((a) => a.isActive);
      },

      getQuotes: (filters = {}, page = 1, pageSize = 20) => {
        requireQuoteAccess(getRole());
        let list = [...get().quotes];
        if (filters.status) list = list.filter((q) => q.status === filters.status);
        if (filters.createdBy) list = list.filter((q) => q.createdByUserId === filters.createdBy);
        if (filters.customerId) list = list.filter((q) => q.customerId === filters.customerId);
        if (filters.dateFrom) list = list.filter((q) => q.createdAt >= filters.dateFrom!);
        if (filters.dateTo) list = list.filter((q) => q.createdAt.slice(0, 10) <= filters.dateTo!);
        if (filters.search) {
          const s = filters.search.toLowerCase();
          list = list.filter(
            (q) =>
              q.quoteNumber.toLowerCase().includes(s) ||
              (q.vehicleSnapshot && `${q.vehicleSnapshot.year} ${q.vehicleSnapshot.make} ${q.vehicleSnapshot.model}`.toLowerCase().includes(s))
          );
        }
        const total = list.length;
        const start = (page - 1) * pageSize;
        const items = list.slice(start, start + pageSize);
        return { items, total, page, pageSize };
      },

      getQuoteById: (id) => {
        requireQuoteAccess(getRole());
        return get().quotes.find((q) => q.id === id);
      },

      getLineItemsByQuoteId: (quoteId) => {
        requireQuoteAccess(getRole());
        return get().quoteLineItems.filter((li) => li.quoteId === quoteId);
      },

      getFollowUpsByQuoteId: (quoteId) => {
        requireQuoteAccess(getRole());
        return get().quoteFollowUps.filter((f) => f.quoteId === quoteId);
      },

      createQuote: (payload) => {
        requireQuoteAccess(getRole());
        const state = get();
        const multRec = state.vehicleClassMultipliers.find((m) => m.id === payload.vehicleClassMultiplierId);
        const multiplier = multRec?.multiplier ?? 1;
        const quoteId = `sq_${Date.now()}`;
        const lineItems = buildLineItems(
          quoteId,
          multiplier,
          payload,
          state.quoteTemplates,
          state.quoteAddons
        );
        const discountAmount = payload.discountAmount ?? 0;
        const { subtotal, total, discountRequiresApproval } = recalcTotals(lineItems, discountAmount);
        const quoteNumbers = state.quotes.map((q) => q.quoteNumber);
        const quoteNumber = nextQuoteNumber(quoteNumbers);
        const now = new Date().toISOString();
        const validUntil = payload.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const quote: SmartQuote = {
          id: quoteId,
          quoteNumber,
          customerId: payload.customerId,
          pipelineLeadId: payload.pipelineLeadId,
          vehicleId: payload.vehicleId,
          vehicleSnapshot: payload.vehicleSnapshot,
          vehicleClassMultiplierId: payload.vehicleClassMultiplierId,
          createdByUserId: payload.createdByUserId,
          status: "draft",
          selectedTier: null,
          subtotal,
          discountAmount,
          discountRequiresApproval,
          discountApprovedByUserId: null,
          total,
          notes: payload.notes,
          validUntil,
          sentAt: null,
          acceptedAt: null,
          convertedToJobId: null,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          quotes: [quote, ...s.quotes],
          quoteLineItems: [...s.quoteLineItems, ...lineItems],
        }));
        return quote;
      },

      updateQuote: (id, payload) => {
        requireQuoteAccess(getRole());
        const state = get();
        const quote = state.quotes.find((q) => q.id === id);
        if (!quote || quote.status !== "draft") return null;
        const multiplierRec = state.vehicleClassMultipliers.find(
          (m) => m.id === (payload.vehicleClassMultiplierId ?? quote.vehicleClassMultiplierId)
        );
        const multiplier = multiplierRec?.multiplier ?? 1;
        let lineItems = state.quoteLineItems.filter((li) => li.quoteId === id);
        if (payload.lineItems !== undefined) {
          lineItems = buildLineItems(
            id,
            multiplier,
            {
              ...payload,
              customerId: quote.customerId,
              pipelineLeadId: quote.pipelineLeadId,
              vehicleId: quote.vehicleId,
              vehicleSnapshot: quote.vehicleSnapshot,
              vehicleClassMultiplierId: payload.vehicleClassMultiplierId ?? quote.vehicleClassMultiplierId,
              createdByUserId: quote.createdByUserId,
              notes: payload.notes ?? quote.notes,
              validUntil: payload.validUntil ?? quote.validUntil,
              lineItems: payload.lineItems,
            } as CreateQuotePayload,
            state.quoteTemplates,
            state.quoteAddons
          );
          set((s) => ({
            quoteLineItems: s.quoteLineItems.filter((li) => li.quoteId !== id).concat(lineItems),
          }));
        } else {
          lineItems = get().quoteLineItems.filter((li) => li.quoteId === id);
        }
        const discountAmount = payload.discountAmount ?? quote.discountAmount;
        const { subtotal, total, discountRequiresApproval } = recalcTotals(lineItems, discountAmount);
        const updated: SmartQuote = {
          ...quote,
          ...(payload.notes !== undefined && { notes: payload.notes }),
          ...(payload.validUntil !== undefined && { validUntil: payload.validUntil }),
          ...(payload.vehicleClassMultiplierId !== undefined && { vehicleClassMultiplierId: payload.vehicleClassMultiplierId }),
          discountAmount,
          subtotal,
          total,
          discountRequiresApproval,
          discountApprovedByUserId: discountRequiresApproval ? null : quote.discountApprovedByUserId,
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({
          quotes: s.quotes.map((q) => (q.id === id ? updated : q)),
        }));
        return updated;
      },

      sendQuote: (id) => {
        requireQuoteAccess(getRole());
        const state = get();
        const quote = state.quotes.find((q) => q.id === id);
        if (!quote || quote.status !== "draft") return null;
        if (quote.discountRequiresApproval && !quote.discountApprovedByUserId) return null;
        const now = new Date().toISOString();
        const updated: SmartQuote = {
          ...quote,
          status: "sent",
          sentAt: now,
          updatedAt: now,
        };
        set((s) => ({
          quotes: s.quotes.map((q) => (q.id === id ? updated : q)),
        }));
        return updated;
      },

      acceptQuote: (id, selectedTier) => {
        requireQuoteAccess(getRole());
        const state = get();
        const quote = state.quotes.find((q) => q.id === id);
        if (!quote || quote.status !== "sent") return null;
        const now = new Date().toISOString();
        const updated: SmartQuote = {
          ...quote,
          status: "accepted",
          selectedTier,
          acceptedAt: now,
          updatedAt: now,
        };
        set((s) => ({
          quotes: s.quotes.map((q) => (q.id === id ? updated : q)),
        }));
        return updated;
      },

      declineQuote: (id) => {
        requireQuoteAccess(getRole());
        const state = get();
        const quote = state.quotes.find((q) => q.id === id);
        if (!quote || quote.status !== "sent") return null;
        const now = new Date().toISOString();
        const updated: SmartQuote = {
          ...quote,
          status: "declined",
          updatedAt: now,
        };
        set((s) => ({
          quotes: s.quotes.map((q) => (q.id === id ? updated : q)),
        }));
        return updated;
      },

      approveDiscount: (id) => {
        requireCeoOnly(getRole());
        const state = get();
        const quote = state.quotes.find((q) => q.id === id);
        if (!quote || !quote.discountRequiresApproval) return null;
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return null;
        const now = new Date().toISOString();
        const updated: SmartQuote = {
          ...quote,
          discountRequiresApproval: false,
          discountApprovedByUserId: userId,
          updatedAt: now,
        };
        set((s) => ({
          quotes: s.quotes.map((q) => (q.id === id ? updated : q)),
        }));
        return updated;
      },

      convertToJob: (id) => {
        requireQuoteAccess(getRole());
        const state = get();
        const quote = state.quotes.find((q) => q.id === id);
        if (!quote || quote.status !== "accepted" || quote.convertedToJobId) return null;
        if (!quote.customerId || !quote.vehicleId) return null;
        const { addJob } = useJobsStore.getState();
        const { addJobToVehicle } = useVehiclesStore.getState();
        const jobId = `job_quote_${Date.now()}`;
        const now = new Date().toISOString();
        const intakeProgress = STAGE_PROGRESS.intake;
        const job: ServiceJob = {
          id: jobId,
          shopId: SHOP_ID,
          customerId: quote.customerId,
          vehicleId: quote.vehicleId,
          serviceId: "svc_2",
          stage: "intake",
          progress: intakeProgress,
          status: "active",
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          stageUpdates: [
            {
              id: `update_${jobId}_intake`,
              jobId,
              stage: "intake",
              progress: intakeProgress,
              createdAt: now,
              createdBy: quote.createdByUserId,
            },
          ],
          notes: [],
          mediaIds: [],
          quoteTotal: quote.total,
          createdAt: now,
          updatedAt: now,
        };
        addJob(job);
        addJobToVehicle(quote.vehicleId, jobId);
        const updated: SmartQuote = {
          ...quote,
          convertedToJobId: jobId,
          updatedAt: now,
        };
        set((s) => ({
          quotes: s.quotes.map((q) => (q.id === id ? updated : q)),
        }));
        return { jobId, quoteId: id };
      },

      getStats: () => {
        requireCeoOnly(getRole());
        const quotes = get().quotes;
        const lineItems = get().quoteLineItems;
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        thisMonthStart.setHours(0, 0, 0, 0);
        const sent = quotes.filter((q) => q.sentAt != null);
        const accepted = quotes.filter((q) => q.status === "accepted");
        const totalSent = sent.length;
        const acceptanceRate = totalSent > 0 ? Math.round((accepted.length / totalSent) * 100) : 0;
        const avgValue =
          accepted.length > 0
            ? accepted.reduce((s, q) => s + q.total, 0) / accepted.length
            : 0;
        const byStatus: Record<SmartQuote["status"], number> = {
          draft: 0,
          sent: 0,
          accepted: 0,
          declined: 0,
          expired: 0,
        };
        quotes.forEach((q) => {
          byStatus[q.status]++;
        });
        const templateCounts: Record<string, { label: string; count: number }> = {};
        lineItems
          .filter((li) => li.type === "service" && li.quoteTemplateId)
          .forEach((li) => {
            const id = li.quoteTemplateId!;
            if (!templateCounts[id]) templateCounts[id] = { label: li.label, count: 0 };
            templateCounts[id].count++;
          });
        const topServicesQuoted = Object.entries(templateCounts)
          .map(([templateId, { label, count }]) => ({ templateId, label, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        const sentThisMonth = sent.filter((q) => q.sentAt && new Date(q.sentAt) >= thisMonthStart).length;
        return {
          totalQuotesSent: sent.length,
          sentThisMonth,
          acceptanceRate,
          averageQuoteValue: Math.round(avgValue * 100) / 100,
          quotesByStatus: byStatus,
          topServicesQuoted,
        };
      },
    }),
    {
      name: "wraptors-quote-builder",
      partialize: (state) => ({
        quotes: state.quotes,
        quoteLineItems: state.quoteLineItems,
        quoteFollowUps: state.quoteFollowUps,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<QuoteBuilderState> | null;
        return {
          ...current,
          quoteTemplates: current.quoteTemplates,
          vehicleClassMultipliers: current.vehicleClassMultipliers,
          quoteAddons: current.quoteAddons,
          quotes: Array.isArray(p?.quotes) && p.quotes.length > 0 ? p.quotes : current.quotes,
          quoteLineItems: Array.isArray(p?.quoteLineItems) && p.quoteLineItems.length > 0 ? p.quoteLineItems : current.quoteLineItems,
          quoteFollowUps: Array.isArray(p?.quoteFollowUps) ? p.quoteFollowUps : current.quoteFollowUps,
        };
      },
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
      ),
    }
  )
);

