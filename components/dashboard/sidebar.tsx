"use client";

import { Settings, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CREATE_ASSIGNMENT_HREF,
  settingsNavItem,
  sidebarNavItems,
} from "./nav-items";
import { VedaLogo } from "./veda-logo";

type SidebarProps = {
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
};

function getActiveNavId(pathname: string) {
  if (pathname === "/" || pathname.startsWith("/assignments"))
    return "assignments";
  if (pathname.startsWith("/home")) return "home";
  if (pathname.startsWith("/groups")) return "groups";
  if (pathname.startsWith("/toolkit")) return "toolkit";
  if (pathname.startsWith("/library")) return "library";
  if (pathname.startsWith("/settings")) return "settings";
  return "assignments";
}

export function Sidebar({ onNavigate, showClose, onClose }: SidebarProps) {
  const pathname = usePathname();
  const activeNavId = getActiveNavId(pathname);

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col rounded-2xl bg-white px-4 py-5 shadow-sm lg:w-[272px]">
      <div className="flex items-center justify-between px-1">
        <VedaLogo />
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <Link
        href={CREATE_ASSIGNMENT_HREF}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-[#d4a574]/60 bg-[#1a1a1a] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2d2d2d]"
      >
        <Sparkles className="h-4 w-4 text-[#fbbf24]" />
        Create Assignment
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {sidebarNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeNavId;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#f3f4f6] text-[#1a1a1a]"
                  : "text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#1a1a1a]"
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] shrink-0 ${
                  isActive ? "text-[#1a1a1a]" : "text-[#6b7280]"
                }`}
                strokeWidth={isActive ? 2.25 : 2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 pt-4">
        <Link
          href={settingsNavItem.href}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            activeNavId === "settings"
              ? "bg-[#f3f4f6] text-[#1a1a1a]"
              : "text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#1a1a1a]"
          }`}
        >
          <Settings className="h-[18px] w-[18px] text-[#6b7280]" />
          {settingsNavItem.label}
        </Link>

        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#f3f4f6] p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fde68a] text-lg">
            🐵
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#1a1a1a]">
              Delhi Public School
            </p>
            <p className="truncate text-xs text-[#6b7280]">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
