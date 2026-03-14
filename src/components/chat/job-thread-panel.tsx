"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore, useTeamStore, useNotificationsStore } from "@/stores";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatComposer } from "@/components/chat/chat-composer";
import { getJobThreadParticipantIds } from "@/lib/chat/participants";
import { jobThreadTitle } from "@/lib/chat/format";
import { buildMentionNotification } from "@/lib/chat/notifications";
import type { ServiceJob } from "@/types";
import type { Customer, Vehicle, Service, StaffUser } from "@/types";

interface JobThreadPanelProps {
  job: ServiceJob;
  customer: Customer | null;
  vehicle: Vehicle | null;
  service: Service | null;
  currentUserId: string;
}

export function JobThreadPanel({
  job,
  vehicle,
  service,
  currentUserId,
}: JobThreadPanelProps) {
  const teamMembers = useTeamStore((s) => s.members);
  const getOrCreateJobThread = useChatStore((s) => s.getOrCreateJobThread);
  const getMessagesForThread = useChatStore((s) => s.getMessagesForThread);
  const addMessage = useChatStore((s) => s.addMessage);
  const addNotification = useNotificationsStore((s) => s.addNotification);

  const title = jobThreadTitle(vehicle?.make, vehicle?.model, service?.name) || `Job ${job.id}`;
  const participantIds = useMemo(
    () => getJobThreadParticipantIds(teamMembers, job),
    [teamMembers, job]
  );

  const thread = useMemo(
    () => getOrCreateJobThread(job.id, title, participantIds),
    [job.id, title, participantIds, getOrCreateJobThread]
  );

  const messages = getMessagesForThread(thread.id);
  const staffById = useMemo(() => {
    const m = new Map<string, StaffUser>();
    teamMembers.forEach((s) => m.set(s.id, s));
    return m;
  }, [teamMembers]);

  const handleSend = (body: string, mentionUserIds: string[], mentionEveryone?: boolean) => {
    const msg = addMessage(thread.id, currentUserId, body, { mentionUserIds });
    if (!msg) return;
    const senderName = staffById.get(currentUserId)?.name ?? "Someone";
    const notified = new Set<string>(mentionUserIds);

    if (mentionEveryone) {
      thread.participantIds.forEach((userId) => {
        if (userId === currentUserId) return;
        if (notified.has(userId)) return;
        notified.add(userId);
        addNotification(buildMentionNotification(userId, senderName, body, thread));
      });
    }
    mentionUserIds.forEach((mentionedUserId) => {
      if (mentionedUserId === currentUserId) return;
      addNotification(buildMentionNotification(mentionedUserId, senderName, body, thread));
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4 text-wraptors-gold" />
          Job thread
        </CardTitle>
        <Link
          href={`/chat?thread=${thread.id}`}
          className="text-xs font-medium text-wraptors-gold hover:underline"
        >
          Open in Chat →
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-wraptors-muted">
          Coordinate with ops and assigned tech. @mention to notify.
        </p>
        <div className="rounded-lg border border-wraptors-border bg-wraptors-black/50 overflow-hidden flex flex-col max-h-80">
          <ScrollArea className="flex-1 min-h-[120px]">
            <ChatMessageList
              messages={messages}
              staffById={staffById}
              currentUserId={currentUserId}
            />
          </ScrollArea>
          <ChatComposer
            threadId={thread.id}
            currentUserId={currentUserId}
            staff={teamMembers}
            onSend={handleSend}
            canPost={true}
            placeholder="Message… @mention"
          />
        </div>
      </CardContent>
    </Card>
  );
}
