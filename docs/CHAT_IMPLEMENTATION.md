# Chat System Implementation Summary

## 1. What Was Implemented

- **Job thread chat** – Each job has an internal thread; accessible from Job Detail and the Chat page. Participants: CEO, receptionist(s), assigned technician. Role-scoped so technicians only see assigned job threads.
- **Direct messages (DMs)** – Staff-to-staff DMs (CEO ↔ Receptionist, CEO ↔ Technician, Receptionist ↔ Technician). Notifications on new DM and on @mention.
- **Channels** – Three fixed channels: **Operations** (CEO + Receptionist), **Shop Floor** (CEO + Receptionist + Technician), **Announcements** (all read; CEO-only post).
- **@mentions** – Composer shows a dropdown when typing `@`; selection inserts the name and stores `mentionUserIds` on the message. Mentioned users get a portal notification with a link to the thread or job.
- **Chat page** – Left panel: Job Threads, Direct Messages, Channels (role-filtered). Main panel: thread title, job link when applicable, message list, composer. Empty state when no thread selected.
- **Job Detail integration** – “Job thread” card with compact message list and composer; “Open in Chat →” links to `/chat?thread=...`.
- **Notifications** – Notifications filtered by `userId`. New types: `chat_mention`, `chat_message`. Mention notifications link to job or `/chat?thread=...`. DM notifications for the other participant(s).

---

## 2. Files Created

| Path | Purpose |
|------|--------|
| `src/lib/chat/channels.ts` | Channel definitions (operations, shop_floor, announcements) and `getChannelsForRole` / `canPostInChannel` |
| `src/lib/chat/visibility.ts` | `canUserSeeThread`, `getVisibleThreads` using role + job scope |
| `src/data/chat-mock.ts` | Mock threads (job, DM, channel) and messages with sample @mentions |
| `src/stores/chat.ts` | Chat store: threads, messages, addMessage, getThreadById, getMessagesForThread, getOrCreateJobThread |
| `src/components/chat/chat-thread-list.tsx` | Left-panel list: Job threads, DMs, Channels with last preview and time |
| `src/components/chat/chat-message-list.tsx` | Message list with sender, timestamp, styled @mentions, system messages |
| `src/components/chat/chat-composer.tsx` | Text input, @mention dropdown (keyboard + click), send; Enter to send |
| `src/components/chat/job-thread-panel.tsx` | Job thread card for Job Detail: messages + composer + “Open in Chat” link |

---

## 3. Files Modified

| Path | Changes |
|------|--------|
| `src/types/index.ts` | `NotificationType` + `chat_mention`, `chat_message`; added `ChatThreadType`, `ChatThread`, `ChatMessage`, `ChatChannelDef` |
| `src/lib/navigation/sidebar.ts` | Added “Chat” to CEO sidebar (Receptionist and Technician already had it) |
| `src/stores/index.ts` | Export `useChatStore` |
| `src/app/chat/page.tsx` | Replaced placeholder with full chat UI: visible threads, thread list, message list, composer, send + mention/DM notifications, `?thread=` support |
| `src/components/jobs/job-detail-view.tsx` | Import and render `JobThreadPanel` after Notes card |
| `src/components/layout/top-bar.tsx` | Notifications filtered by `user?.id`; use `myNotifications` for count and list |
| `src/app/notifications/page.tsx` | Filter notifications by `user?.id`; “Mark all read” only marks current user’s |
| `src/components/dashboard/dashboard-page.tsx` | CEODashboard: filter notifications by `user?.id` for recent activity |
| `src/data/mock.ts` | Two new `chat_mention` notifications (staff_ceo, staff_technician) for demo |
| `src/stores/jobs.ts` | Type fix: mock storage cast to `as unknown as Storage` for SSR |

---

## 4. Chat Architecture Overview

- **Thread types**: `job` (linked to `jobId`), `dm` (`participantIds`), `channel` (`channelKey`).
- **Visibility**: `getVisibleThreads(threads, currentUserId, role, getJobById)` uses `getScopeForRole`: CEO all, Receptionist all job threads + all channels they’re allowed, Technician only assigned job threads + Shop Floor + Announcements.
- **Channels**: `CHAT_CHANNELS` in `src/lib/chat/channels.ts`; posting rules via `canPostInChannel` (Announcements = CEO only).
- **State**: Zustand `useChatStore` with in-memory threads/messages; `getOrCreateJobThread` creates a job thread when first opened from Job Detail.
- **Mentions**: Composer tracks `@` and shows staff dropdown; on send, body is parsed for `@Name` and matching staff IDs are stored in `mentionUserIds`. Notification created per mentioned user with link to thread or job.

---

## 5. Mention / Notification Flow

1. User types `@` in composer → dropdown lists mentionable staff (all except current user).
2. User selects from dropdown or keyboard → `@DisplayName` is inserted.
3. On Send: body and `mentionUserIds` (parsed from body) are passed to `addMessage(..., { mentionUserIds })`.
4. For each `mentionUserIds` entry: `addNotification({ type: 'chat_mention', userId: mentionedUserId, title: 'X mentioned you', message: excerpt, link: /jobs/:id or /chat?thread=... })`.
5. For DMs: additionally, for each other participant (not already mentioned), `addNotification({ type: 'chat_message', ... })`.
6. Notifications are filtered by `userId === currentUser.id` in top-bar, notifications page, and dashboard.

---

## 6. Role Visibility Rules

| Role | Job threads | DMs | Channels |
|------|-------------|-----|----------|
| **CEO** | All | All they participate in | Operations, Shop Floor, Announcements (can post all) |
| **Receptionist** | All (operational) | All they participate in | Operations, Shop Floor, Announcements (read-only on Announcements) |
| **Technician** | Only assigned jobs | All they participate in | Shop Floor, Announcements (read-only) |

Technicians do **not** see Operations channel, unassigned job threads, or other users’ DMs.

---

## 7. Demo Assumptions

- **Auth**: Logins use `staff_ceo`, `staff_receptionist`, `staff_technician`; notifications for “CEO” are tied to `staff_ceo`.
- **Data**: All chat data is in-memory (Zustand); no persistence, no backend. Refreshing the app resets new messages.
- **Attachments**: `ChatMessage.attachmentIds` exists; no upload UI yet (placeholder for future).
- **Realtime**: No WebSockets; updates only when the user interacts (e.g. sending a message).

---

## 8. Demo-Only vs Future-Ready

**Demo-only (replace for production):**

- Chat store uses in-memory arrays and mock data; replace with API + persistence.
- No WebSockets; add real-time subscription for new messages and typing if needed.
- Notifications are in-memory; replace with server-driven notifications and push.

**Production-ready structure:**

- Types (`ChatThread`, `ChatMessage`, `ChatChannelDef`) and role/channel rules are suitable for a backend.
- Visibility and channel access use existing `getScopeForRole` and permission model.
- Notification types `chat_mention` and `chat_message` and per-user filtering fit a real notification service.
- Job thread creation via `getOrCreateJobThread` can be replaced with a “create thread for job” API.
