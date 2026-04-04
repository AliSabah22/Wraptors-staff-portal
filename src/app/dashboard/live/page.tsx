import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/role-permissions";
import { LiveBoardClient } from "./live-board-client";

export default async function LiveDashboardPage() {
  const user = await requireAuth();
  if (!hasPermission(user.role, "jobs.view_operational")) {
    redirect("/dashboard?error=unauthorized");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live job board</h1>
        <p className="text-wraptors-muted mt-0.5 text-sm">
          Non-completed jobs refresh automatically when the database changes.
        </p>
      </div>
      <LiveBoardClient />
    </div>
  );
}
