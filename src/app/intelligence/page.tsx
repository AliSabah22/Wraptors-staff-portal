"use client";

import { ComingSoonCards } from "@/components/intelligence/coming-soon-cards";
import { IntelligenceChat } from "@/components/intelligence/intelligence-chat";

/**
 * CEO-only Intelligence hub: conversational analytics + Coming Soon placeholders.
 * Access enforced by route (AuthGuard), API, and sidebar visibility.
 */
export default function IntelligencePage() {
  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6 overflow-hidden">
      <aside className="w-full lg:w-1/3 shrink-0 overflow-y-auto">
        <ComingSoonCards />
      </aside>
      <main className="flex-1 min-h-0 flex flex-col">
        <IntelligenceChat />
      </main>
    </div>
  );
}
