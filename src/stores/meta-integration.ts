import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MetaIntegrationConfig } from "@/types";

interface MetaIntegrationState extends MetaIntegrationConfig {
  setConnected: (connected: boolean) => void;
  setSelectedPageId: (pageId: string | null) => void;
  setSelectedFormIds: (formIds: string[]) => void;
  setSyncToPipelineEnabled: (enabled: boolean) => void;
  toggleFormId: (formId: string) => void;
}

const defaultConfig: MetaIntegrationConfig = {
  connected: false,
  selectedPageId: null,
  selectedFormIds: [],
  syncToPipelineEnabled: true,
};

export const useMetaIntegrationStore = create<MetaIntegrationState>()(
  persist(
    (set) => ({
      ...defaultConfig,

      setConnected: (connected) =>
        set((s) => ({
          connected,
          selectedPageId: connected && !s.selectedPageId ? "page_wraptors" : s.selectedPageId,
          selectedFormIds: connected && s.selectedFormIds.length === 0 ? ["form_wrap_quote"] : s.selectedFormIds,
        })),

      setSelectedPageId: (selectedPageId) => set({ selectedPageId }),

      setSelectedFormIds: (selectedFormIds) => set({ selectedFormIds }),

      setSyncToPipelineEnabled: (syncToPipelineEnabled) => set({ syncToPipelineEnabled }),

      toggleFormId: (formId) =>
        set((s) => ({
          selectedFormIds: s.selectedFormIds.includes(formId)
            ? s.selectedFormIds.filter((id) => id !== formId)
            : [...s.selectedFormIds, formId],
        })),
    }),
    {
      name: "wraptors-meta-integration",
      partialize: (s) => ({
        connected: s.connected,
        selectedPageId: s.selectedPageId,
        selectedFormIds: s.selectedFormIds,
        syncToPipelineEnabled: s.syncToPipelineEnabled,
      }),
    }
  )
);
