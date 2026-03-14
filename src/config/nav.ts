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
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Active Jobs", href: "/jobs", icon: Wrench },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Quote Requests", href: "/quote-requests", icon: FileText },
  { label: "Pipeline", href: "/pipeline", icon: Kanban },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Media Library", href: "/media", icon: Image },
  { label: "Services", href: "/services", icon: Package },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Team", href: "/team", icon: UserCog },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];
