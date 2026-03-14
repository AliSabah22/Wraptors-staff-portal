"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { SearchDialog } from "@/components/layout/search-dialog";
import { AddCustomerModal } from "@/components/customers/add-customer-modal";
import { CreateQuoteModal } from "@/components/quotes/create-quote-modal";
import { CreateJobModal } from "@/components/jobs/create-job-modal";
import { useUIStore } from "@/stores";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const addCustomerModalOpen = useUIStore((s) => s.addCustomerModalOpen);
  const setAddCustomerModalOpen = useUIStore((s) => s.setAddCustomerModalOpen);
  const createQuoteModalOpen = useUIStore((s) => s.createQuoteModalOpen);
  const setCreateQuoteModalOpen = useUIStore((s) => s.setCreateQuoteModalOpen);
  const createJobModalOpen = useUIStore((s) => s.createJobModalOpen);
  const setCreateJobModalOpen = useUIStore((s) => s.setCreateJobModalOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-wraptors-black">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>

      <SearchDialog />
      <AddCustomerModal
        open={addCustomerModalOpen}
        onOpenChange={setAddCustomerModalOpen}
      />
      <CreateQuoteModal
        open={createQuoteModalOpen}
        onOpenChange={setCreateQuoteModalOpen}
      />
      <CreateJobModal
        open={createJobModalOpen}
        onOpenChange={setCreateJobModalOpen}
      />
    </div>
  );
}
