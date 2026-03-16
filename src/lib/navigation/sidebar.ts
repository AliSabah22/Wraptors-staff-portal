/**
 * Role-based sidebar navigation.
 * Returns only the nav items the role is allowed to see.
 */

import {
  LayoutDashboard,
  Wrench,
  Users,
  FileText,
  Kanban,
  Calendar,
  Image,
  Package,
  Receipt,
  BarChart3,
  UserCog,
  Bell,
  Settings,
  MessageCircle,
  Upload,
  Sparkles,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import type { StaffRoleCode } from "@/lib/auth/roles";

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * CEO: full sidebar.
 */
function getSidebarForCEO(): SidebarNavItem[] {
  return [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Campaigns", href: "/campaigns", icon: Megaphone },
    { label: "Intelligence", href: "/intelligence", icon: Sparkles },
    { label: "Active Jobs", href: "/jobs", icon: Wrench },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Quote Requests", href: "/quote-requests", icon: FileText },
    { label: "Quotes", href: "/quotes", icon: FileText },
    { label: "Pipeline", href: "/pipeline", icon: Kanban },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Media Library", href: "/media", icon: Image },
    { label: "Services", href: "/services", icon: Package },
    { label: "Invoices", href: "/invoices", icon: Receipt },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Team", href: "/team", icon: UserCog },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Chat", href: "/chat", icon: MessageCircle },
    { label: "Settings", href: "/settings", icon: Settings },
  ];
}

/**
 * Receptionist: operational tools only. No Analytics, Team, Settings.
 */
function getSidebarForReceptionist(): SidebarNavItem[] {
  return [
    { label: "Dashboard", href: "/dashboard/operations", icon: LayoutDashboard },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Active Jobs", href: "/jobs", icon: Wrench },
    { label: "Quote Requests", href: "/quote-requests", icon: FileText },
    { label: "Quotes", href: "/quotes", icon: FileText },
    { label: "Pipeline", href: "/pipeline", icon: Kanban },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Media Library", href: "/media", icon: Image },
    { label: "Services", href: "/services", icon: Package },
    { label: "Team", href: "/team", icon: UserCog },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Chat", href: "/chat", icon: MessageCircle },
  ];
}

/**
 * Technician: minimal execution workspace.
 */
function getSidebarForTechnician(): SidebarNavItem[] {
  return [
    { label: "Dashboard", href: "/dashboard/my-jobs", icon: LayoutDashboard },
    { label: "My Jobs", href: "/jobs", icon: Wrench },
    { label: "Uploads", href: "/media", icon: Upload },
    { label: "Team", href: "/team", icon: UserCog },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Chat", href: "/chat", icon: MessageCircle },
  ];
}

export function getSidebarItemsForRole(role: StaffRoleCode): SidebarNavItem[] {
  switch (role) {
    case "ceo":
      return getSidebarForCEO();
    case "receptionist":
      return getSidebarForReceptionist();
    case "technician":
      return getSidebarForTechnician();
    default:
      return getSidebarForTechnician();
  }
}
