"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StaffUser } from "@/types";
import { normalizeRole } from "@/lib/auth/roles";
import type { StaffRoleCode } from "@/lib/auth/roles";
import { getDefaultRedirectForRole } from "@/lib/auth/access";
import { mockLogin as doMockLogin, MOCK_STAFF_PASSWORD, registerMockStaff } from "@/data/auth-mock";
import { mockStaff } from "@/data/mock";

export interface AuthState {
  user: StaffUser | null;
  isLoading: boolean;
  isHydrated: boolean;
  setUser: (user: StaffUser | null) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: () => void;
  login: (email: string, password: string) => Promise<{ ok: true; redirect: string } | { ok: false; error: string }>;
  logout: () => void;
  getRole: () => StaffRoleCode;
  isAuthenticated: () => boolean;
}

function seedMockAuth(): void {
  try {
    if (!Array.isArray(mockStaff)) return;
    mockStaff.forEach((u) => {
      if (u?.email) {
        registerMockStaff({
          user: u,
          password: MOCK_STAFF_PASSWORD,
        });
      }
    });
  } catch {
    // Mock seed must not block app load (e.g. missing types or bad data)
  }
}

seedMockAuth();

/** Safe storage: parse errors (e.g. corrupted localStorage) don't crash the app. */
const safeAuthStorage = {
  getItem: (name: string): string | null => {
    try {
      return typeof localStorage !== "undefined" ? localStorage.getItem(name) : null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage?.setItem(name, value);
    } catch {
      // ignore
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage?.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isHydrated: false,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setHydrated: () => set({ isHydrated: true }),
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const result = doMockLogin(email, password);
          if (!result) {
            set({ isLoading: false });
            return { ok: false, error: "Invalid email or password." };
          }
          const user: StaffUser = {
            ...result.user,
            role: result.role as StaffUser["role"],
          };
          set({ user, isLoading: false });
          const role = normalizeRole(user.role);
          const redirect = getDefaultRedirectForRole(role);
          return { ok: true, redirect };
        } catch {
          set({ isLoading: false });
          return { ok: false, error: "Something went wrong." };
        }
      },
      logout: () => set({ user: null }),
      getRole: () => {
        const user = get().user;
        return user ? normalizeRole(user.role) : "technician";
      },
      isAuthenticated: () => !!get().user,
    }),
    {
      name: "wraptors-auth",
      partialize: (s) => ({ user: s.user }),
      skipHydration: true,
      storage: {
        getItem: (name) => {
          const raw = safeAuthStorage.getItem(name);
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch {
            safeAuthStorage.removeItem(name);
            return null;
          }
        },
        setItem: (name, value) => safeAuthStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => safeAuthStorage.removeItem(name),
      },
      onRehydrateStorage: () => (state, err) => {
        useAuthStore.getState().setHydrated();
      },
    }
  )
);
