"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/auth";
import { Send, Trash2 } from "lucide-react";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY = 20;
const API_PATH = "/api/intelligence/chat";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const SUGGESTIONS = [
  "How is the business performing this month?",
  "Which technician has the most blocked jobs?",
  "Where are we losing the most leads?",
  "What's our quote acceptance rate?",
  "Which service is generating the most revenue?",
  "How many customers haven't returned in 6 months?",
  "Are any jobs at risk of missing their deadline?",
  "What does our pipeline look like right now?",
];

export function IntelligenceChat() {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading || !user?.id) return;

      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.slice(-(MAX_HISTORY - 1)), userMessage]);
      setInput("");
      setIsLoading(true);

      const assistantId = `assistant_${Date.now()}`;
      let requestStreamError: string | null = null;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isStreaming: true,
        },
      ]);

      const history = messages
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))
        .concat([{ role: "user" as const, content: trimmed }]);

      abortRef.current = new AbortController();
      let fullContent = "";
      try {
        const res = await fetch(API_PATH, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-User-Id": user.id },
          body: JSON.stringify({
            message: trimmed,
            conversation_history: history.slice(0, -1),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const errorMsg =
            res.status === 403
              ? "You don't have access to Intelligence."
              : res.status === 429
                ? data.error ?? "Rate limit exceeded. Try again later."
                : data.error ?? "Something went wrong. Please try again.";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: `[Error: ${errorMsg}]`,
                    isStreaming: false,
                  }
                : m
            )
          );
          setIsLoading(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: "[No response stream]", isStreaming: false } : m
            )
          );
          setIsLoading(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const payload = line.slice(6);
              if (payload === "[DONE]") continue;
              try {
                const data = JSON.parse(payload);
                if (data.text) {
                  fullContent += data.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: fullContent, isStreaming: true }
                        : m
                    )
                  );
                }
                if (data.error) requestStreamError = data.error;
              } catch {
                // ignore parse errors
              }
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: requestStreamError
                    ? `${fullContent}\n\n[Response interrupted — please try again]`
                    : fullContent,
                  isStreaming: false,
                }
              : m
          )
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "Something went wrong fetching your data. Please try again.",
                  isStreaming: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [user?.id, messages, isLoading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (s: string) => {
    setInput(s);
    sendMessage(s);
  };

  const handleClear = () => {
    setMessages([]);
    setClearDialogOpen(false);
  };

  const showSuggestions = messages.length === 0;

  return (
    <Card className="border-wraptors-border bg-wraptors-surface flex flex-col h-full min-h-[500px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Wraptors Intelligence</CardTitle>
          <CardDescription>Ask anything about your business performance</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-wraptors-muted">Powered by Claude</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setClearDialogOpen(true)}
            disabled={messages.length === 0}
            className="text-wraptors-muted hover:text-white"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 min-h-0 p-0">
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4 min-h-[200px]">
          {showSuggestions && (
            <div className="space-y-3">
              <p className="text-sm text-wraptors-muted">Suggested questions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestion(s)}
                    className="text-left text-sm rounded-lg border border-wraptors-border bg-wraptors-charcoal/50 hover:bg-wraptors-surface-hover hover:border-wraptors-gold/50 px-4 py-2.5 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  m.role === "user"
                    ? "bg-wraptors-gold/20 text-white"
                    : "bg-wraptors-charcoal/80 border border-wraptors-border text-wraptors-muted-light"
                }`}
              >
                {m.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none">
                    {m.isStreaming && !m.content ? (
                      <span className="text-wraptors-muted flex items-center gap-1">
                        <span className="flex gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-wraptors-gold animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-wraptors-gold animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-wraptors-gold animate-bounce [animation-delay:300ms]" />
                        </span>
                        Thinking...
                      </span>
                    ) : m.content ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                          li: ({ children }) => <li className="mb-0.5">{children}</li>,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    ) : null}
                {m.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-0.5 bg-wraptors-gold animate-pulse" />
                )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
        <form onSubmit={handleSubmit} className="p-4 border-t border-wraptors-border">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask about revenue, jobs, pipeline, quotes, technicians, customers..."
              className="flex-1 border-wraptors-border bg-wraptors-charcoal"
              disabled={isLoading}
              maxLength={MAX_MESSAGE_LENGTH}
            />
            <Button type="submit" disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {input.length >= 800 && (
            <p className="text-xs text-wraptors-muted mt-1">
              {input.length}/{MAX_MESSAGE_LENGTH}
            </p>
          )}
        </form>
      </CardContent>
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent showClose={false}>
          <DialogHeader>
            <DialogTitle>Clear this conversation?</DialogTitle>
            <DialogDescription>
              This cannot be undone. Suggestion chips will show again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClear}>
              Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
