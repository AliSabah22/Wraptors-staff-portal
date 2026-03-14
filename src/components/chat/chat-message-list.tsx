"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import type { StaffUser } from "@/types";
import { formatChatTime } from "@/lib/chat/format";

interface ChatMessageListProps {
  messages: ChatMessage[];
  staffById: Map<string, StaffUser>;
  currentUserId: string;
}

/** Renders message body with @mentions styled. @everyone is one token only; @Name can be @Name or @First Last. */
function MessageBody({ body, staffById }: { body: string; staffById: Map<string, StaffUser> }) {
  // Match @everyone as a single token, or @Name / @First Last for people (one optional word after space)
  const mentionRegex = /@(everyone)|@([^\s@]+(?:\s+[^\s@]+)?)/g;
  const parts: { type: "text" | "mention"; value: string }[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = mentionRegex.exec(body)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ type: "text", value: body.slice(lastIndex, m.index) });
    }
    const token = (m[1] ?? m[2] ?? "").trim();
    parts.push({ type: "mention", value: token ? `@${token}` : m[0] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < body.length) {
    parts.push({ type: "text", value: body.slice(lastIndex) });
  }
  if (parts.length === 0) {
    return <span className="whitespace-pre-wrap break-words">{body}</span>;
  }
  return (
    <span className="whitespace-pre-wrap break-words text-[15px] leading-snug">
      {parts.map((p, i) =>
        p.type === "mention" ? (
          <span
            key={i}
            className="font-medium text-wraptors-gold bg-wraptors-gold/15 px-1 py-0.5 rounded"
          >
            {p.value}
          </span>
        ) : (
          <span key={i}>{p.value}</span>
        )
      )}
    </span>
  );
}

export function ChatMessageList({ messages, staffById, currentUserId }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-wraptors-muted text-sm px-4">
        No messages yet. Send one below.
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto px-4 py-3 space-y-5">
      {messages.map((msg) => {
        const sender = staffById.get(msg.senderId);
        const isSystem = msg.messageType === "system";
        const isOwn = msg.senderId === currentUserId;

        if (isSystem) {
          return (
            <div key={msg.id} className="flex justify-center">
              <p className="text-xs text-wraptors-muted/90 bg-wraptors-charcoal/60 px-3 py-1.5 rounded-full">
                {msg.body}
              </p>
            </div>
          );
        }

        return (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col max-w-[82%]",
              isOwn ? "self-end items-end" : "self-start items-start"
            )}
          >
            <div
              className={cn(
                "rounded-lg px-3.5 py-2.5 shadow-sm",
                isOwn
                  ? "bg-wraptors-gold/15 text-white border border-wraptors-gold/25"
                  : "bg-wraptors-charcoal/80 border border-wraptors-border/80 text-wraptors-muted-light"
              )}
            >
              {!isOwn && (
                <p className="text-[11px] font-semibold text-wraptors-gold mb-1.5 tracking-tight">
                  {sender?.name ?? "Unknown"}
                </p>
              )}
              <MessageBody body={msg.body} staffById={staffById} />
            </div>
            <p
              className={cn(
                "text-[10px] text-wraptors-muted/80 mt-1 tabular-nums",
                isOwn ? "text-right" : "text-left"
              )}
            >
              {formatChatTime(msg.createdAt)}
            </p>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
