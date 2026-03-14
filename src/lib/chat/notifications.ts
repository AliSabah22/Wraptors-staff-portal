/**
 * Centralized chat notification copy and payloads.
 * Ensures mention and DM notifications are clear and job-context first.
 */

import type { ChatThread } from "@/types";

const SHOP_ID = "shop_wraptors_1";

export interface MentionNotificationPayload {
  shopId: string;
  userId: string;
  type: "chat_mention";
  title: string;
  message: string;
  read: boolean;
  link: string;
  createdAt: string;
}

export interface DmNotificationPayload {
  shopId: string;
  userId: string;
  type: "chat_message";
  title: string;
  message: string;
  read: boolean;
  link: string;
  createdAt: string;
}

function preview(text: string, maxLen: number): string {
  const t = text.trim();
  if (!t) return "";
  return t.length <= maxLen ? t : t.slice(0, maxLen).trim() + "…";
}

/**
 * Build notification when someone is @mentioned.
 * Job thread: "Alex mentioned you in BMW M4 · Full Wrap"
 * Channel: "Alex mentioned you in Operations"
 * DM: "Alex mentioned you"
 */
export function buildMentionNotification(
  mentionedUserId: string,
  senderName: string,
  body: string,
  thread: ChatThread
): MentionNotificationPayload {
  const link = thread.jobId ? `/jobs/${thread.jobId}` : `/chat?thread=${thread.id}`;
  const context = thread.type === "job"
    ? ` in ${thread.title}`
    : thread.type === "channel"
      ? ` in ${thread.title}`
      : "";
  return {
    shopId: SHOP_ID,
    userId: mentionedUserId,
    type: "chat_mention",
    title: `${senderName} mentioned you${context}`,
    message: preview(body, 72),
    read: false,
    link,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Build notification for new DM (other participant).
 */
export function buildDmNotification(
  recipientUserId: string,
  senderName: string,
  body: string,
  threadId: string
): DmNotificationPayload {
  return {
    shopId: SHOP_ID,
    userId: recipientUserId,
    type: "chat_message",
    title: `Message from ${senderName}`,
    message: preview(body, 80),
    read: false,
    link: `/chat?thread=${threadId}`,
    createdAt: new Date().toISOString(),
  };
}
