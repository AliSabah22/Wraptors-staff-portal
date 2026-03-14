import { create } from "zustand";

type ViewMode = "kanban" | "table";
type QuickCreateType = "job" | "customer" | "quote" | null;

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  activeJobsView: ViewMode;
  setActiveJobsView: (view: ViewMode) => void;
  quickCreateOpen: QuickCreateType;
  setQuickCreateOpen: (type: QuickCreateType) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  addCustomerModalOpen: boolean;
  setAddCustomerModalOpen: (open: boolean) => void;
  createQuoteModalOpen: boolean;
  setCreateQuoteModalOpen: (open: boolean) => void;
  createJobModalOpen: boolean;
  setCreateJobModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  activeJobsView: "kanban",
  setActiveJobsView: (view) => set({ activeJobsView: view }),
  quickCreateOpen: null,
  setQuickCreateOpen: (type) => set({ quickCreateOpen: type }),
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
  addCustomerModalOpen: false,
  setAddCustomerModalOpen: (open) => set({ addCustomerModalOpen: open }),
  createQuoteModalOpen: false,
  setCreateQuoteModalOpen: (open) => set({ createQuoteModalOpen: open }),
  createJobModalOpen: false,
  setCreateJobModalOpen: (open) => set({ createJobModalOpen: open }),
}));
