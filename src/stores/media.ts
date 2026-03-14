import { create } from "zustand";
import type { MediaAsset } from "@/types";
import { mockMedia } from "@/data/mock";

interface MediaState {
  items: MediaAsset[];
  setItems: (items: MediaAsset[]) => void;
  getById: (id: string) => MediaAsset | undefined;
  addMedia: (item: MediaAsset) => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  items: mockMedia,

  setItems: (items) => set({ items }),

  getById: (id) => get().items.find((m) => m.id === id),

  addMedia: (item) => set((state) => ({ items: [item, ...state.items] })),
}));
