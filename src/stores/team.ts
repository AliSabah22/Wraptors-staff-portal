import { create } from "zustand";
import type { StaffUser } from "@/types";
import { mockStaff } from "@/data/mock";

export type AddMemberResult = { added: true } | { added: false; reason: "duplicate_email" | "duplicate_id" };

interface TeamState {
  members: StaffUser[];
  /** Adds a member only if email (case-insensitive) and id are not already present. Returns result so callers can show feedback. */
  addMember: (member: StaffUser) => AddMemberResult;
  removeMember: (id: string) => void;
  /** Returns true if a member with this email already exists (case-insensitive). */
  hasMemberWithEmail: (email: string) => boolean;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  members: [...mockStaff],

  addMember: (member) => {
    const state = get();
    const emailLower = member.email.trim().toLowerCase();
    const duplicateEmail = state.members.some((m) => m.email.trim().toLowerCase() === emailLower);
    if (duplicateEmail) return { added: false, reason: "duplicate_email" };
    const duplicateId = state.members.some((m) => m.id === member.id);
    if (duplicateId) return { added: false, reason: "duplicate_id" };
    set((s) => ({ members: [member, ...s.members] }));
    return { added: true };
  },

  hasMemberWithEmail: (email) => {
    const emailLower = email.trim().toLowerCase();
    return get().members.some((m) => m.email.trim().toLowerCase() === emailLower);
  },

  removeMember: (id) =>
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
    })),
}));
