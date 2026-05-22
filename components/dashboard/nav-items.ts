import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardList,
  Clock,
  LayoutGrid,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  id: string;
};

export const sidebarNavItems: DashboardNavItem[] = [
  { id: "home", label: "Home", href: "/dashboard/home", icon: LayoutGrid },
  { id: "groups", label: "My Groups", href: "/dashboard/groups", icon: Users },
  {
    id: "assignments",
    label: "Assignments",
    href: "/dashboard",
    icon: ClipboardList,
  },
  {
    id: "toolkit",
    label: "AI Teacher's Toolkit",
    href: "/dashboard/toolkit",
    icon: BookOpen,
  },
  {
    id: "library",
    label: "My Library",
    href: "/dashboard/library",
    icon: Clock,
  },
];

export const settingsNavItem: DashboardNavItem = {
  id: "settings",
  label: "Settings",
  href: "/dashboard/settings",
  icon: Settings,
};

export const mobileNavItems: DashboardNavItem[] = [
  { id: "home", label: "Home", href: "/dashboard/home", icon: LayoutGrid },
  {
    id: "assignments",
    label: "Assignments",
    href: "/dashboard",
    icon: ClipboardList,
  },
  {
    id: "library",
    label: "Library",
    href: "/dashboard/library",
    icon: Clock,
  },
  {
    id: "toolkit",
    label: "AI Toolkit",
    href: "/dashboard/toolkit",
    icon: Sparkles,
  },
];
