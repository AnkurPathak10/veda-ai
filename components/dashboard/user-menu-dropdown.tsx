"use client";

import { SignOutButton, useClerk, useUser } from "@clerk/nextjs";
import {
  BookOpen,
  ChevronDown,
  Home,
  LogOut,
  Settings,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUserSettingsStore } from "@/stores/user-settings-store";

type MenuItemProps = {
  href: string;
  icon: typeof Home;
  label: string;
  onSelect: () => void;
};

function MenuLink({ href, icon: Icon, label, onSelect }: MenuItemProps) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f3f4f6] hover:text-[#1a1a1a]"
    >
      <Icon className="h-4 w-4 text-[#6b7280]" />
      {label}
    </Link>
  );
}

function ProfileAvatar({
  imageUrl,
  name,
  size = "md",
}: {
  imageUrl?: string | null;
  name: string;
  size?: "md" | "lg";
}) {
  const dimension = size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-sm";

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={`${dimension} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${dimension} flex shrink-0 items-center justify-center rounded-full bg-[#e5e7eb] font-semibold text-[#4b5563]`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function UserMenuDropdown() {
  const { user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const schoolName = useUserSettingsStore((s) => s.settings?.schoolName);
  const schoolLocation = useUserSettingsStore((s) => s.settings?.schoolLocation);

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "User";
  const email = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  const handleManageAccount = () => {
    closeMenu();
    openUserProfile();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-[#f3f4f6]"
        aria-label="Open account menu"
        aria-expanded={open}
      >
        <ProfileAvatar
          imageUrl={user?.imageUrl}
          name={isLoaded ? displayName : "User"}
        />
        <span className="hidden max-w-[140px] truncate text-sm font-medium text-[#1a1a1a] lg:block">
          {isLoaded ? displayName : "..."}
        </span>
        <ChevronDown
          className={`hidden h-4 w-4 text-[#9ca3af] transition-transform lg:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,280px)] overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-xl">
          <div className="border-b border-[#e5e7eb] px-4 py-4">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                imageUrl={user?.imageUrl}
                name={displayName}
                size="lg"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1a1a1a]">
                  {displayName}
                </p>
                {email && (
                  <p className="truncate text-xs text-[#6b7280]">{email}</p>
                )}
                {(schoolName || schoolLocation) && (
                  <p className="mt-1 truncate text-xs text-[#9ca3af]">
                    {[schoolName, schoolLocation].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-2">
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
              Quick links
            </p>
            <MenuLink
              href="/home"
              icon={Home}
              label="Home"
              onSelect={closeMenu}
            />
            <MenuLink
              href="/"
              icon={Sparkles}
              label="Assignments"
              onSelect={closeMenu}
            />
            <MenuLink
              href="/library"
              icon={BookOpen}
              label="My Library"
              onSelect={closeMenu}
            />
            <MenuLink
              href="/groups"
              icon={Users}
              label="My Groups"
              onSelect={closeMenu}
            />
            <MenuLink
              href="/settings"
              icon={Settings}
              label="Settings"
              onSelect={closeMenu}
            />
          </div>

          <div className="border-t border-[#e5e7eb] p-2">
            <button
              type="button"
              onClick={handleManageAccount}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f3f4f6] hover:text-[#1a1a1a]"
            >
              <UserCog className="h-4 w-4 text-[#6b7280]" />
              Manage account
            </button>

            <SignOutButton>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#ef4444] transition-colors hover:bg-[#fef2f2]"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      )}
    </div>
  );
}
