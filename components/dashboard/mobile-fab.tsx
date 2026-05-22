"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CREATE_ASSIGNMENT_HREF } from "./nav-items";

export function MobileFab() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/assignments/create") ||
    /^\/assignments\/[^/]+$/.test(pathname)
  ) {
    return null;
  }

  return (
    <Link
      href={CREATE_ASSIGNMENT_HREF}
      aria-label="Create assignment"
      className="fixed bottom-[88px] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 transition-transform hover:scale-105 active:scale-95 lg:hidden"
    >
      <Plus className="h-6 w-6 text-[#ef4444]" strokeWidth={2.5} />
    </Link>
  );
}
