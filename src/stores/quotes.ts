import { create } from "zustand";
import type { QuoteRequest, QuoteStatus } from "@/types";
import { mockQuotes } from "@/data/mock";

interface QuotesState {
  quotes: QuoteRequest[];
  setQuotes: (quotes: QuoteRequest[]) => void;
  getQuoteById: (id: string) => QuoteRequest | undefined;
  updateQuoteStatus: (id: string, status: QuoteStatus, convertedToJobId?: string) => void;
  addQuote: (quote: QuoteRequest) => void;
  updateQuote: (id: string, data: Partial<QuoteRequest>) => void;
  removeQuotesByCustomerId: (customerId: string) => void;
}

export const useQuotesStore = create<QuotesState>((set, get) => ({
  quotes: mockQuotes,

  setQuotes: (quotes) => set({ quotes }),

  getQuoteById: (id) => get().quotes.find((q) => q.id === id),

  updateQuoteStatus: (id, status, convertedToJobId) =>
    set((state) => ({
      quotes: state.quotes.map((q) =>
        q.id === id
          ? {
              ...q,
              status,
              convertedToJobId: convertedToJobId ?? q.convertedToJobId,
              updatedAt: new Date().toISOString(),
            }
          : q
      ),
    })),

  addQuote: (quote) => set((state) => ({ quotes: [quote, ...state.quotes] })),

  updateQuote: (id, data) =>
    set((state) => ({
      quotes: state.quotes.map((q) =>
        q.id === id ? { ...q, ...data, updatedAt: new Date().toISOString() } : q
      ),
    })),

  removeQuotesByCustomerId: (customerId) =>
    set((state) => ({
      quotes: state.quotes.filter((q) => q.customerId !== customerId),
    })),
}));
