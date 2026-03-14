"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Send, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StaffUser } from "@/types";

/** Tag that notifies everyone in the thread/channel. */
export const EVERYONE_MENTION_TAG = "everyone";

interface ChatComposerProps {
  threadId: string;
  currentUserId: string;
  staff: StaffUser[];
  onSend: (body: string, mentionUserIds: string[], mentionEveryone?: boolean) => void;
  canPost: boolean;
  placeholder?: string;
  /** Shown when canPost is false (e.g. read-only channel). */
  disabledHint?: string;
}

/** Get staff that can be mentioned (exclude current user). */
function getMentionableStaff(staff: StaffUser[], currentUserId: string): StaffUser[] {
  return staff.filter((s) => s.id !== currentUserId);
}

export function ChatComposer({
  threadId,
  currentUserId,
  staff,
  onSend,
  canPost,
  placeholder = "Message…",
  disabledHint,
}: ChatComposerProps) {
  const [value, setValue] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mentionable = getMentionableStaff(staff, currentUserId);

  const showEveryoneOption =
    mentionQuery !== null &&
    (mentionQuery === "" || "everyone".startsWith(mentionQuery.toLowerCase()));
  const filteredMentions = mentionQuery
    ? mentionable.filter((u) =>
        u.name.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : mentionable;

  const optionsCount = (showEveryoneOption ? 1 : 0) + filteredMentions.length;
  const showMentionDropdown = mentionQuery !== null && optionsCount > 0;

  const insertMention = useCallback(
    (user: StaffUser) => {
      if (!inputRef.current) return;
      const before = value.slice(0, value.lastIndexOf("@"));
      const newValue = `${before}@${user.name} `;
      setValue(newValue);
      setMentionQuery(null);
      setMentionIndex(0);
      inputRef.current.focus();
    },
    [value]
  );

  const insertEveryone = useCallback(() => {
    if (!inputRef.current) return;
    const before = value.slice(0, value.lastIndexOf("@"));
    const newValue = `${before}@${EVERYONE_MENTION_TAG} `;
    setValue(newValue);
    setMentionQuery(null);
    setMentionIndex(0);
    inputRef.current.focus();
  }, [value]);

  useEffect(() => {
    if (!value.includes("@")) {
      setMentionQuery(null);
      return;
    }
    const lastAt = value.lastIndexOf("@");
    if (lastAt === -1) return;
    const afterAt = value.slice(lastAt + 1);
    // If there's already a space after @, the mention is done (e.g. after selecting from list) — close dropdown so user can keep typing and Enter sends
    if (afterAt.includes(" ")) {
      setMentionQuery(null);
      return;
    }
    const query = afterAt.trim();
    setMentionQuery(query);
    setMentionIndex(0);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentionDropdown) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => Math.min(i + 1, optionsCount - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (showEveryoneOption && mentionIndex === 0) {
          insertEveryone();
        } else {
          const userIndex = showEveryoneOption ? mentionIndex - 1 : mentionIndex;
          if (filteredMentions[userIndex]) insertMention(filteredMentions[userIndex]);
        }
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || !canPost) return;

    const mentionUserIds: string[] = [];
    let mentionEveryone = false;
    const mentionRegex = /@([^@\n]+?)(?=\s|$|@)/g;
    let m: RegExpExecArray | null;
    while ((m = mentionRegex.exec(trimmed)) !== null) {
      const display = m[1].trim().toLowerCase();
      if (!display) continue;
      if (display === EVERYONE_MENTION_TAG) {
        mentionEveryone = true;
        continue;
      }
      const user = mentionable.find(
        (u) =>
          u.name.toLowerCase() === display ||
          u.name.toLowerCase().startsWith(display) ||
          u.name.toLowerCase().includes(display)
      );
      if (user && !mentionUserIds.includes(user.id)) {
        mentionUserIds.push(user.id);
      }
    }

    onSend(trimmed, mentionUserIds, mentionEveryone);
    setValue("");
  };

  return (
    <div className="border-t border-wraptors-border bg-wraptors-charcoal/40 p-3 relative">
      {showMentionDropdown && (
        <div
          className="absolute bottom-full left-3 right-3 mb-1.5 rounded-lg border border-wraptors-gold/30 bg-wraptors-charcoal shadow-xl max-h-44 overflow-auto z-10 py-0.5"
          role="listbox"
        >
          <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-wraptors-muted/80">
            Mention
          </p>
          {showEveryoneOption && (
            <button
              type="button"
              role="option"
              aria-selected={mentionIndex === 0}
              className={cn(
                "w-full text-left px-3 py-2 text-sm flex items-center gap-2 rounded-md transition-colors",
                mentionIndex === 0
                  ? "bg-wraptors-gold/15 text-wraptors-gold"
                  : "hover:bg-wraptors-surface-hover text-white"
              )}
              onClick={insertEveryone}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span className="font-medium">Everyone</span>
              <span className="text-xs text-wraptors-muted">Notify all in this thread</span>
            </button>
          )}
          {filteredMentions.slice(0, 6).map((u, i) => {
            const optionIndex = showEveryoneOption ? i + 1 : i;
            return (
              <button
                key={u.id}
                type="button"
                role="option"
                aria-selected={optionIndex === mentionIndex}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm flex items-center gap-2 rounded-md transition-colors",
                  optionIndex === mentionIndex
                    ? "bg-wraptors-gold/15 text-wraptors-gold"
                    : "hover:bg-wraptors-surface-hover text-white"
                )}
                onClick={() => insertMention(u)}
              >
                <span className="font-medium">{u.name}</span>
                <span className="text-xs text-wraptors-muted">{u.role}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="flex gap-2 items-end">
        <div className="flex-1 flex flex-col gap-1">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "min-h-[40px] max-h-28 resize-none rounded-lg border border-wraptors-border bg-wraptors-black px-3 py-2 text-sm text-white placeholder:text-wraptors-muted focus:outline-none focus:ring-2 focus:ring-wraptors-gold/40 focus:border-wraptors-gold/50",
              !canPost && "opacity-60 cursor-not-allowed"
            )}
            disabled={!canPost}
          />
          <p className="text-[10px] text-wraptors-muted/70">
            {!canPost && disabledHint ? disabledHint : "Enter to send · @ to mention"}
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          className="shrink-0 bg-wraptors-gold text-wraptors-black hover:bg-wraptors-gold-light h-10 w-10"
          onClick={handleSubmit}
          disabled={!value.trim() || !canPost}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
