import { create } from "zustand";
import type { NotificationItem } from "@/types";
import { mockNotifications } from "@/data/mock";

interface NotificationsState {
  items: NotificationItem[];
  setItems: (items: NotificationItem[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: () => number;
  addNotification: (item: Omit<NotificationItem, "id">) => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: mockNotifications,

  setItems: (items) => set({ items }),

  markAsRead: (id) =>
    set((state) => ({
      items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  markAllAsRead: () =>
    set((state) => ({
      items: state.items.map((n) => ({ ...n, read: true })),
    })),

  unreadCount: () => get().items.filter((n) => !n.read).length,

  addNotification: (item) =>
    set((state) => ({
      items: [
        {
          ...item,
          id: `notif_${Date.now()}`,
        },
        ...state.items,
      ],
    })),
}));
