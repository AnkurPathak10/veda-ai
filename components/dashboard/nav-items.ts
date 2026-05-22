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

export const CREATE_ASSIGNMENT_HREF = "/assignments/create";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  id: string;
};

export const sidebarNavItems: DashboardNavItem[] = [
  { id: "home", label: "Home", href: "/home", icon: LayoutGrid },
  { id: "groups", label: "My Groups", href: "/groups", icon: Users },
  {
    id: "assignments",
    label: "Assignments",
    href: "/",
    icon: ClipboardList,
  },
  {
    id: "toolkit",
    label: "AI Teacher's Toolkit",
    href: "/toolkit",
    icon: BookOpen,
  },
  {
    id: "library",
    label: "My Library",
    href: "/library",
    icon: Clock,
  },
];

export const settingsNavItem: DashboardNavItem = {
  id: "settings",
  label: "Settings",
  href: "/settings",
  icon: Settings,
};

export const mobileNavItems: DashboardNavItem[] = [
  { id: "home", label: "Home", href: "/home", icon: LayoutGrid },
  {
    id: "assignments",
    label: "Assignments",
    href: "/",
    icon: ClipboardList,
  },
  {
    id: "library",
    label: "Library",
    href: "/library",
    icon: Clock,
  },
  {
    id: "toolkit",
    label: "AI Toolkit",
    href: "/toolkit",
    icon: Sparkles,
  },
];
