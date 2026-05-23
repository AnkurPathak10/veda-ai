"use client";

import { create } from "zustand";
import type { NotificationItem } from "@/lib/notifications/types";

type NotificationsState = {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  setNotifications: (
    notifications: NotificationItem[],
    unreadCount: number,
  ) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  prependNotification: (notification: NotificationItem) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
};

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  setNotifications: (notifications, unreadCount) =>
    set({ notifications, unreadCount, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  prependNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
      unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
    })),
  markRead: (id) =>
    set((state) => {
      const target = state.notifications.find((item) => item.id === id);
      const wasUnread = target && !target.read;

      return {
        notifications: state.notifications.map((item) =>
          item.id === id ? { ...item, read: true } : item,
        ),
        unreadCount: wasUnread
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    }),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((item) => ({ ...item, read: true })),
      unreadCount: 0,
    })),
}));
