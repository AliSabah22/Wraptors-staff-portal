"use client";

import { useMemo, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, Bell, UserPlus, FileText, Briefcase, CheckCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useUIStore, useNotificationsStore } from "@/stores";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useRole } from "@/hooks/useRole";
import { getRoleLabel } from "@/lib/auth/roles";

export function TopBar() {
  const router = useRouter();
  const { setSearchOpen, setAddCustomerModalOpen, setCreateQuoteModalOpen, setCreateJobModalOpen } = useUIStore();
  const items = useNotificationsStore((s) => s.items);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  const { user } = useCurrentUser();
  const { role: resolvedRole } = useRole();
  const { hasPermission } = usePermissions();
  const { signOut } = useAuth();

  const myNotifications = useMemo(
    () => items.filter((n) => n.userId === user?.id),
    [items, user?.id]
  );
  const unreadCount = useMemo(
    () => myNotifications.filter((n) => !n.read).length,
    [myNotifications]
  );

  const canQuickCreate =
    hasPermission("customers.create") ||
    hasPermission("quotes.create") ||
    hasPermission("jobs.create");

  const handleQuickCreate = useCallback((action: "customer" | "quote" | "job") => {
    if (action === "customer") setAddCustomerModalOpen(true);
    else if (action === "quote") setCreateQuoteModalOpen(true);
    else setCreateJobModalOpen(true);
  }, [setAddCustomerModalOpen, setCreateQuoteModalOpen, setCreateJobModalOpen]);

  const handleLogout = useCallback(async () => {
    await signOut();
    router.replace("/login");
  }, [signOut, router]);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-wraptors-border bg-wraptors-charcoal/95 backdrop-blur supports-[backdrop-filter]:bg-wraptors-charcoal/80 px-6">
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex flex-1 max-w-md items-center gap-2 rounded-lg border border-wraptors-border bg-wraptors-black/50 px-3 py-2 text-sm text-wraptors-muted hover:border-wraptors-gold/30 hover:text-wraptors-muted-light transition-colors text-left"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span>Search jobs, customers…</span>
      </button>

      <div className="flex items-center gap-2">
        {canQuickCreate && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Quick Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {hasPermission("customers.create") && (
                <DropdownMenuItem onClick={() => handleQuickCreate("customer")} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add customer
                </DropdownMenuItem>
              )}
              {hasPermission("quotes.create") && (
                <DropdownMenuItem onClick={() => handleQuickCreate("quote")} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Create quote request
                </DropdownMenuItem>
              )}
              {hasPermission("jobs.create") && (
                <DropdownMenuItem onClick={() => handleQuickCreate("job")} className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  New job
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-wraptors-gold text-[10px] font-bold text-wraptors-black">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
            <div className="border-b border-wraptors-border px-3 py-2 flex items-center justify-between">
              <span className="text-sm font-medium">Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-wraptors-gold hover:text-wraptors-gold-light"
                  onClick={() => markAllAsRead()}
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="max-h-[320px]">
              {myNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-wraptors-muted">
                  No notifications
                </div>
              ) : (
                <div className="py-1">
                  {myNotifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link ?? "/notifications"}
                      onClick={() => !n.read && markAsRead(n.id)}
                      className={cn(
                        "flex gap-3 px-3 py-2.5 text-left transition-colors border-l-2 border-transparent",
                        !n.read && "border-l-wraptors-gold bg-wraptors-gold/5",
                        "hover:bg-wraptors-surface-hover"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          n.read ? "bg-wraptors-muted" : "bg-wraptors-gold"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        <p className="text-xs text-wraptors-muted mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-wraptors-muted mt-1">
                          {formatDateTime(n.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="border-t border-wraptors-border p-2">
              <Link
                href="/notifications"
                className="block w-full rounded-md py-2 text-center text-xs font-medium text-wraptors-gold hover:bg-wraptors-surface-hover"
              >
                View all notifications
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8 border border-wraptors-gold/30">
                <AvatarFallback className="text-xs">
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") ?? "—"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-2">
              <p className="text-sm font-medium">{user?.name ?? "—"}</p>
              <p className="text-xs text-wraptors-muted">
                {resolvedRole ? getRoleLabel(resolvedRole) : "Loading role..."}
              </p>
            </div>
            <DropdownMenuSeparator />
            {hasPermission("settings.manage") && (
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
