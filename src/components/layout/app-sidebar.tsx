"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getSidebarItemsForRole } from "@/lib/navigation/sidebar";
import { getDashboardPathForRole } from "@/lib/auth/access";
import { useUIStore } from "@/stores";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeftClose, PanelLeft } from "lucide-react";

const DASHBOARD_PATHS = ["/dashboard", "/dashboard/operations", "/dashboard/my-jobs"] as const;

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (DASHBOARD_PATHS.includes(href as (typeof DASHBOARD_PATHS)[number])) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

/** Full page nav to avoid ChunkLoadError on client-side route transitions. */
function NavLink({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-wraptors-gold/10 text-wraptors-gold"
          : "text-wraptors-muted-light hover:bg-wraptors-surface hover:text-white"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active && "text-wraptors-gold")} />
      {label}
    </a>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { role } = useRole();
  if (!role) {
    return (
      <aside className="flex w-56 shrink-0 items-center justify-center border-r border-wraptors-border bg-wraptors-charcoal">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-wraptors-gold border-t-transparent" />
      </aside>
    );
  }
  const navItems = getSidebarItemsForRole(role);
  const dashboardHref = getDashboardPathForRole(role);

  return (
    <>
      {!sidebarOpen && (
        <div className="flex flex-col w-14 shrink-0 border-r border-wraptors-border bg-wraptors-charcoal items-center py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Open sidebar"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        </div>
      )}
      <aside
        className={cn(
          "flex flex-col border-r border-wraptors-border bg-wraptors-charcoal transition-all duration-300",
          sidebarOpen ? "w-56 shrink-0" : "w-0 overflow-hidden"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-wraptors-border px-4 shrink-0">
          <a href={dashboardHref} className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-wraptors-gold">
              WRAPTORS
            </span>
            <span className="text-xs text-wraptors-muted uppercase tracking-widest">
              Staff
            </span>
          </a>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        {sidebarOpen && (
          <ScrollArea className="flex-1 px-2 py-4">
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => {
                const active = isActive(pathname ?? null, item.href);
                return (
                  <NavLink
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    active={active}
                    icon={item.icon}
                    label={item.label}
                  />
                );
              })}
            </nav>
          </ScrollArea>
        )}
      </aside>
    </>
  );
}
