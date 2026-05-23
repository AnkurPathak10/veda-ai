"use client";

import { useAuth } from "@clerk/nextjs";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/api";
import type { NotificationItem, NotificationType } from "@/lib/notifications/types";
import { useNotificationsStore } from "@/stores/notifications-store";
import { RelativeTime } from "@/components/ui/relative-time";

function NotificationIcon({ type }: { type: NotificationType }) {
  if (type === "SUCCESS") {
    return <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />;
  }

  if (type === "ERROR") {
    return <AlertCircle className="h-4 w-4 text-[#ef4444]" />;
  }

  return <Info className="h-4 w-4 text-[#3b82f6]" />;
}

export function NotificationDropdown() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const isLoading = useNotificationsStore((s) => s.isLoading);
  const setNotifications = useNotificationsStore((s) => s.setNotifications);
  const setLoading = useNotificationsStore((s) => s.setLoading);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  const loadNotifications = useCallback(async () => {
    setLoading(true);

    try {
      const token = await getToken();
      const data = await fetchNotifications(token);
      setNotifications(data.notifications, data.unreadCount);
    } catch {
      // Bell badge is optional; failures should not break the navbar.
    } finally {
      setLoading(false);
    }
  }, [getToken, setLoading, setNotifications]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleOpen = () => {
    setOpen((current) => !current);
    void loadNotifications();
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      const token = await getToken();

      if (!notification.read) {
        await markNotificationRead(notification.id, token);
        markRead(notification.id);
      }
    } catch {
      // Optimistic UI is fine if mark-read fails.
    }

    setOpen(false);

    if (notification.href) {
      router.push(notification.href);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = await getToken();
      await markAllNotificationsRead(token);
      markAllRead();
    } catch {
      // Ignore — user can retry.
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#4b5563] transition-colors hover:bg-[#f3f4f6]"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f97316] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,360px)] overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="text-xs font-medium text-[#6b7280] transition-colors hover:text-[#1a1a1a]"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[min(60vh,420px)] overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-[#6b7280]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[#6b7280]">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void handleNotificationClick(notification)}
                  className={`flex w-full gap-3 border-b border-[#f3f4f6] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#f9fafb] ${
                    notification.read ? "opacity-70" : "bg-[#fffbeb]/40"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <NotificationIcon type={notification.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1a1a1a]">
                      {notification.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[#6b7280]">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[11px] text-[#9ca3af]">
                      <RelativeTime value={notification.createdAt} />
                    </p>
                  </div>
                  {!notification.read && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#f97316]" />
                  )}
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-[#e5e7eb] px-4 py-2.5 text-center">
              <Link
                href="/home"
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-[#6b7280] hover:text-[#1a1a1a]"
              >
                View dashboard
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
