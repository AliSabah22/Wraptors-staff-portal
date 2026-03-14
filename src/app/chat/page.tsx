"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle, Wrench, UserPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore, useJobsStore, useTeamStore, useNotificationsStore } from "@/stores";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getVisibleThreads, getEveryoneUserIdsForThread } from "@/lib/chat/visibility";
import { canPostInChannel, getChannelByKey } from "@/lib/chat/channels";
import { buildMentionNotification, buildDmNotification } from "@/lib/chat/notifications";
import { ChatThreadList } from "@/components/chat/chat-thread-list";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatComposer } from "@/components/chat/chat-composer";
import type { ChatThread } from "@/types";
import type { StaffRoleCode } from "@/lib/auth/roles";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const threadParam = searchParams.get("thread");
  const dmParam = searchParams.get("dm");
  const { user, role } = useCurrentUser();
  const currentUserId = user?.id ?? "";
  const threads = useChatStore((s) => s.threads);
  const getThreadById = useChatStore((s) => s.getThreadById);
  const getOrCreateDmThread = useChatStore((s) => s.getOrCreateDmThread);
  const getMessagesForThread = useChatStore((s) => s.getMessagesForThread);
  const addMessage = useChatStore((s) => s.addMessage);
  const getJobById = useJobsStore((s) => s.getJobById);
  const teamMembers = useTeamStore((s) => s.members);
  const addNotification = useNotificationsStore((s) => s.addNotification);

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  useEffect(() => {
    if (threadParam && getThreadById(threadParam)) {
      setSelectedThreadId(threadParam);
    }
  }, [threadParam, getThreadById]);

  useEffect(() => {
    if (!dmParam || !currentUserId || !teamMembers.length) return;
    const other = teamMembers.find((m) => m.id === dmParam);
    if (!other || other.id === currentUserId) return;
    const thread = getOrCreateDmThread(currentUserId, other.id, other.name);
    setSelectedThreadId(thread.id);
    router.replace(`/chat?thread=${thread.id}`, { scroll: false });
  }, [dmParam, currentUserId, teamMembers, getOrCreateDmThread, router]);

  const visibleThreads = useMemo(
    () => getVisibleThreads(threads, currentUserId, role as StaffRoleCode, getJobById),
    [threads, currentUserId, role, getJobById]
  );

  const staffById = useMemo(() => {
    const m = new Map<string, (typeof teamMembers)[number]>();
    teamMembers.forEach((s) => m.set(s.id, s));
    return m;
  }, [teamMembers]);

  const selectedThread = selectedThreadId ? getThreadById(selectedThreadId) : null;
  const messages = selectedThread ? getMessagesForThread(selectedThread.id) : [];

  const canPost = useMemo(() => {
    if (!selectedThread) return false;
    if (selectedThread.type === "dm") return true;
    if (selectedThread.type === "job") return true;
    if (selectedThread.type === "channel" && selectedThread.channelKey) {
      return canPostInChannel(selectedThread.channelKey, role as "ceo" | "receptionist" | "technician");
    }
    return false;
  }, [selectedThread, role]);

  const openDmWith = useCallback(
    (member: (typeof teamMembers)[number]) => {
      if (member.id === currentUserId) return;
      const thread = getOrCreateDmThread(currentUserId, member.id, member.name);
      setSelectedThreadId(thread.id);
      router.replace(`/chat?thread=${thread.id}`, { scroll: false });
    },
    [currentUserId, getOrCreateDmThread, router]
  );

  const handleSendMessage = useCallback(
    (body: string, mentionUserIds: string[], mentionEveryone?: boolean) => {
      if (!selectedThreadId || !currentUserId || !selectedThread) return;
      const msg = addMessage(selectedThreadId, currentUserId, body, { mentionUserIds });
      if (!msg) return;

      const senderName = staffById.get(currentUserId)?.name ?? "Someone";
      const notified = new Set<string>(mentionUserIds);

      if (mentionEveryone) {
        const everyoneIds = getEveryoneUserIdsForThread(selectedThread, teamMembers);
        everyoneIds.forEach((userId) => {
          if (userId === currentUserId) return;
          if (notified.has(userId)) return;
          notified.add(userId);
          addNotification(buildMentionNotification(userId, senderName, body, selectedThread));
        });
      }

      mentionUserIds.forEach((mentionedUserId) => {
        if (mentionedUserId === currentUserId) return;
        addNotification(buildMentionNotification(mentionedUserId, senderName, body, selectedThread));
      });

      if (selectedThread.type === "dm" && !mentionEveryone) {
        selectedThread.participantIds.forEach((participantId) => {
          if (participantId === currentUserId) return;
          if (notified.has(participantId)) return;
          addNotification(buildDmNotification(participantId, senderName, body, selectedThreadId));
        });
      }
    },
    [selectedThreadId, currentUserId, selectedThread, addMessage, addNotification, staffById, teamMembers]
  );

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center text-wraptors-muted">
        Sign in to use chat.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 flex-col h-[calc(100vh-8rem)] min-h-0"
    >
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Chat</h1>
        <p className="text-wraptors-muted mt-0.5">Coordinate on jobs and team updates</p>
      </div>

      <div className="flex flex-1 min-h-0 rounded-xl border border-wraptors-border bg-wraptors-charcoal/30 overflow-hidden">
        <aside className="w-72 shrink-0 border-r border-wraptors-border flex flex-col bg-wraptors-charcoal/50">
          <div className="p-2 border-b border-wraptors-border shrink-0">
            <p className="text-xs font-medium text-wraptors-muted uppercase tracking-wider mb-1.5 px-1">
              Start a conversation
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-wraptors-gold border-wraptors-gold/50 hover:bg-wraptors-gold/10 hover:text-white">
                  <UserPlus className="h-4 w-4" />
                  New direct message
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-auto">
                {(() => {
                  const others = teamMembers.filter((m) => m.id !== currentUserId);
                  if (others.length === 0) {
                    return (
                      <div className="px-2 py-3 text-sm text-wraptors-muted">
                        No other team members to message.
                      </div>
                    );
                  }
                  return others.map((member) => (
                    <DropdownMenuItem
                      key={member.id}
                      onClick={() => openDmWith(member)}
                      className="gap-2 cursor-pointer"
                    >
                      <span className="font-medium">{member.name}</span>
                      <span className="text-xs text-wraptors-muted">{member.role}</span>
                    </DropdownMenuItem>
                  ));
                })()}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <ScrollArea className="flex-1 p-2">
            <ChatThreadList
              threads={visibleThreads}
              selectedThreadId={selectedThreadId}
              onSelectThread={(t: ChatThread) => setSelectedThreadId(t.id)}
              currentUserId={currentUserId}
            />
          </ScrollArea>
        </aside>

        <main className="flex flex-1 flex-col min-w-0">
          {selectedThread ? (
            <>
              <header className="shrink-0 border-b border-wraptors-border px-4 py-3 bg-wraptors-charcoal/50">
                <div className="flex items-center gap-2">
                  {selectedThread.type === "job" ? (
                    <Wrench className="h-4 w-4 text-wraptors-gold shrink-0" />
                  ) : (
                    <MessageCircle className="h-4 w-4 text-wraptors-gold shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-white truncate">{selectedThread.title}</h2>
                    {selectedThread.type === "channel" && selectedThread.channelKey && (
                      <p className="text-xs text-wraptors-muted mt-0.5">
                        {getChannelByKey(selectedThread.channelKey)?.description}
                      </p>
                    )}
                  </div>
                </div>
                {selectedThread.jobId && (
                  <a
                    href={`/jobs/${selectedThread.jobId}`}
                    className="text-xs text-wraptors-gold hover:underline mt-1.5 inline-block"
                  >
                    View job →
                  </a>
                )}
              </header>
              <ScrollArea className="flex-1">
                <ChatMessageList
                  messages={messages}
                  staffById={staffById}
                  currentUserId={currentUserId}
                />
              </ScrollArea>
              <ChatComposer
                threadId={selectedThread.id}
                currentUserId={currentUserId}
                staff={teamMembers}
                onSend={handleSendMessage}
                canPost={canPost}
                disabledHint={
                  selectedThread.type === "channel" && !canPost
                    ? "Only leadership can post here"
                    : undefined
                }
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
              <MessageCircle className="h-12 w-12 text-wraptors-gold/40 mb-3" />
              <p className="text-wraptors-muted font-medium">Select a conversation</p>
              <p className="text-sm text-wraptors-muted mt-1 max-w-xs">
                Job threads first, then DMs and channels.
              </p>
            </div>
          )}
        </main>
      </div>
    </motion.div>
  );
}
