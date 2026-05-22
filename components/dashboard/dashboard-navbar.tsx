"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  LayoutGrid,
  Menu,
} from "lucide-react";
import { VedaLogo } from "./veda-logo";

type DashboardNavbarProps = {
  onMenuClick: () => void;
};

export function DashboardNavbar({ onMenuClick }: DashboardNavbarProps) {
  const { user, isLoaded } = useUser();
  const displayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "User";

  return (
    <header className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm sm:px-5">
      {/* Desktop breadcrumb */}
      <div className="hidden items-center gap-3 lg:flex">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1a1a1a]"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
          <LayoutGrid className="h-4 w-4" />
          <span>Assignment</span>
        </div>
      </div>

      {/* Mobile logo */}
      <div className="lg:hidden">
        <VedaLogo />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#4b5563] transition-colors hover:bg-[#f3f4f6]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#f97316]" />
        </button>

        {/* Desktop user profile */}
        <div className="hidden items-center gap-2 rounded-xl py-1 pl-1 pr-2 lg:flex">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-9 w-9 rounded-full",
              },
            }}
          />
          <span className="max-w-[140px] truncate text-sm font-medium text-[#1a1a1a]">
            {isLoaded ? displayName : "..."}
          </span>
          <ChevronDown className="h-4 w-4 text-[#9ca3af]" />
        </div>

        {/* Mobile user avatar */}
        <div className="lg:hidden">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-9 w-9 rounded-full",
              },
            }}
          />
        </div>

        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#4b5563] transition-colors hover:bg-[#f3f4f6] lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
