"use client";

import {
  ArrowLeft,
  LayoutGrid,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { VedaLogo } from "./veda-logo";
import { NotificationDropdown } from "./notification-dropdown";
import { UserMenuDropdown } from "./user-menu-dropdown";

type DashboardNavbarProps = {
  onMenuClick: () => void;
};

export function DashboardNavbar({ onMenuClick }: DashboardNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isCreateAssignment = pathname.startsWith("/assignments/create");
  const isAssignmentDetail =
    pathname.startsWith("/assignments/") && !isCreateAssignment;
  const pageLabel = pathname.startsWith("/home")
    ? "Home"
    : pathname.startsWith("/groups")
      ? "Groups"
      : pathname.startsWith("/library")
        ? "Library"
        : pathname.startsWith("/settings")
          ? "Settings"
          : pathname.startsWith("/toolkit")
            ? "Toolkit"
            : "Assignment";

  return (
    <header className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm sm:px-5">
      {/* Desktop breadcrumb */}
      <div className="hidden items-center gap-3 lg:flex">
        <button
          type="button"
          onClick={() =>
            router.push(isCreateAssignment || isAssignmentDetail ? "/" : "/")
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1a1a1a]"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
          <LayoutGrid className="h-4 w-4" />
          <Link href="/" className="hover:text-[#6b7280]">
            {pageLabel}
          </Link>
          {isCreateAssignment && (
            <>
              <span>/</span>
              <span className="text-[#1a1a1a]">Create</span>
            </>
          )}
          {isAssignmentDetail && (
            <>
              <span>/</span>
              <span className="text-[#1a1a1a]">View</span>
            </>
          )}
        </div>
      </div>

      {/* Mobile logo */}
      <div className="lg:hidden">
        <VedaLogo />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationDropdown />
        <UserMenuDropdown />

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
