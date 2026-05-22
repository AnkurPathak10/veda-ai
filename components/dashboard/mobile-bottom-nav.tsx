"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavItems } from "./nav-items";

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

export function MobileBottomNav() {
  const pathname = usePathname();
  const activeNavId = getActiveNavId(pathname);

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl bg-[#1a1a1a] px-2 py-2 shadow-lg lg:hidden">
      <ul className="grid grid-cols-4 gap-1">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeNavId;

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-[#9ca3af] hover:text-white/80"
                }`}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={isActive ? 2.25 : 2}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
