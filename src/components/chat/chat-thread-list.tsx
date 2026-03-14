"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { MessageCircle, Wrench, Hash } from "lucide-react";
import type { ChatThread } from "@/types";
import { useChatStore } from "@/stores/chat";
import { formatChatTime, threadPreview } from "@/lib/chat/format";

interface ChatThreadListProps {
  threads: ChatThread[];
  selectedThreadId: string | null;
  onSelectThread: (thread: ChatThread) => void;
  currentUserId: string;
}

export function ChatThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
}: ChatThreadListProps) {
  const getMessagesForThread = useChatStore((s) => s.getMessagesForThread);

  const getLastMessagePreview = (threadId: string) => {
    const msgs = getMessagesForThread(threadId);
    const last = msgs[msgs.length - 1];
    return last?.body ? threadPreview(last.body) : "";
  };

  const { jobThreads, dms, channels } = useMemo(() => {
    const j: ChatThread[] = [];
    const d: ChatThread[] = [];
    const c: ChatThread[] = [];
    threads.forEach((t) => {
      if (t.type === "job") j.push(t);
      else if (t.type === "dm") d.push(t);
      else if (t.type === "channel") c.push(t);
    });
    j.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    d.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    c.sort((a, b) => (a.channelKey ?? "").localeCompare(b.channelKey ?? ""));
    return { jobThreads: j, dms: d, channels: c };
  }, [threads]);

  const renderItem = (thread: ChatThread, icon: React.ReactNode) => {
    const preview = getLastMessagePreview(thread.id);
    const isSelected = selectedThreadId === thread.id;
    return (
      <button
        key={thread.id}
        type="button"
        onClick={() => onSelectThread(thread)}
        className={cn(
          "w-full flex flex-col items-stretch gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors border-l-2",
          isSelected
            ? "border-l-wraptors-gold bg-wraptors-gold/10"
            : "border-l-transparent hover:bg-wraptors-surface-hover"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 text-wraptors-muted">{icon}</span>
          <span className="font-medium text-white truncate text-sm">{thread.title}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0 pl-6">
          <span className="text-xs text-wraptors-muted truncate flex-1">
            {preview || "No messages yet"}
          </span>
          <span className="text-[10px] text-wraptors-muted shrink-0 tabular-nums">
            {formatChatTime(thread.lastMessageAt)}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {jobThreads.length > 0 && (
        <section className="mb-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-wraptors-muted/90 px-2 mb-1.5">
            Job threads
          </h3>
          <div className="space-y-0.5">
            {jobThreads.map((t) => renderItem(t, <Wrench className="h-3.5 w-3.5 text-wraptors-gold/80" />))}
          </div>
        </section>
      )}
      {dms.length > 0 && (
        <section className="mb-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-wraptors-muted/90 px-2 mb-1.5">
            Direct messages
          </h3>
          <div className="space-y-0.5">
            {dms.map((t) => renderItem(t, <MessageCircle className="h-3.5 w-3.5" />))}
          </div>
        </section>
      )}
      {channels.length > 0 && (
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-wraptors-muted/90 px-2 mb-1.5">
            Channels
          </h3>
          <div className="space-y-0.5">
            {channels.map((t) => renderItem(t, <Hash className="h-3.5 w-3.5" />))}
          </div>
        </section>
      )}
    </div>
  );
}
