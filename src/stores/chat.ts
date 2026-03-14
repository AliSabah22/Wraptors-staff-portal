"use client";

import { create } from "zustand";
import type { ChatThread, ChatMessage } from "@/types";
import { mockChatThreads, mockChatMessages } from "@/data/chat-mock";

interface ChatState {
  threads: ChatThread[];
  messages: ChatMessage[];
  addMessage: (
    threadId: string,
    senderId: string,
    body: string,
    options?: { mentionUserIds?: string[]; messageType?: "text" | "system" }
  ) => ChatMessage | null;
  getThreadById: (id: string) => ChatThread | undefined;
  getMessagesForThread: (threadId: string) => ChatMessage[];
  getOrCreateJobThread: (jobId: string, title: string, participantIds: string[]) => ChatThread;
  /** Get existing DM between two users or create one. Prevents duplicate DMs. */
  getOrCreateDmThread: (currentUserId: string, otherUserId: string, otherUserName: string) => ChatThread;
  markThreadRead: (threadId: string) => void;
  /** Optional: unread count per thread for badge. Demo: not persisted. */
  readUpTo: Record<string, string>;
  setReadUpTo: (threadId: string, messageId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  threads: [...mockChatThreads],
  messages: [...mockChatMessages],
  readUpTo: {},

  addMessage: (threadId, senderId, body, options = {}) => {
    const { mentionUserIds = [], messageType = "text" } = options;
    const now = new Date().toISOString();
    const msg: ChatMessage = {
      id: `msg_${Date.now()}`,
      threadId,
      senderId,
      body,
      createdAt: now,
      mentionUserIds,
      messageType,
    };
    set((state) => ({
      messages: [...state.messages, msg],
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, updatedAt: now, lastMessageAt: now } : t
      ),
    }));
    return msg;
  },

  getThreadById: (id) => get().threads.find((t) => t.id === id),

  getMessagesForThread: (threadId) =>
    get()
      .messages.filter((m) => m.threadId === threadId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),

  getOrCreateJobThread: (jobId, title, participantIds) => {
    const existing = get().threads.find((t) => t.type === "job" && t.jobId === jobId);
    if (existing) return existing;
    const now = new Date().toISOString();
    const thread: ChatThread = {
      id: `thread_job_${jobId}`,
      type: "job",
      title,
      participantIds,
      jobId,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
    };
    set((state) => ({ threads: [...state.threads, thread] }));
    return thread;
  },

  getOrCreateDmThread: (currentUserId, otherUserId, otherUserName) => {
    const ids = [currentUserId, otherUserId].sort();
    const stableId = `thread_dm_${ids[0]}_${ids[1]}`;
    const existing = get().threads.find(
      (t) => t.type === "dm" && t.participantIds.length === 2 &&
        new Set(t.participantIds).size === 2 &&
        t.participantIds.includes(currentUserId) &&
        t.participantIds.includes(otherUserId)
    );
    if (existing) return existing;
    const now = new Date().toISOString();
    const thread: ChatThread = {
      id: stableId,
      type: "dm",
      title: otherUserName,
      participantIds: [currentUserId, otherUserId],
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
    };
    set((state) => ({ threads: [...state.threads, thread] }));
    return thread;
  },

  markThreadRead: () => {}, // no-op for demo; could clear unread

  setReadUpTo: (threadId, messageId) =>
    set((state) => ({ readUpTo: { ...state.readUpTo, [threadId]: messageId } })),
}));
