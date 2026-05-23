import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../lib/auth.js";
import {
  CACHE_KEYS,
  CACHE_TTL,
  cacheDel,
  cacheGet,
  cacheSet,
} from "../lib/cache.js";
import { createNotification } from "../lib/notifications.js";
import { prisma } from "../lib/prisma.js";

function formatNotification(notification: {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  read: boolean;
  createdAt: Date;
}) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    href: notification.href,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}

export async function handleListNotifications(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const cacheKey = CACHE_KEYS.notificationsList(dbUserId);
    const cached = await cacheGet<{
      notifications: ReturnType<typeof formatNotification>[];
      unreadCount: number;
    }>(cacheKey);

    if (cached) {
      res.json(cached);
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: dbUserId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    const payload = {
      notifications: notifications.map(formatNotification),
      unreadCount,
    };

    await cacheSet(cacheKey, payload, CACHE_TTL.NOTIFICATIONS_LIST);

    res.json(payload);
  } catch (error) {
    console.error("Failed to list notifications:", error);
    res.status(500).json({ error: "Failed to load notifications" });
  }
}

const createNotificationSchema = z.object({
  type: z.enum(["SUCCESS", "ERROR", "INFO"]).optional(),
  title: z.string().trim().min(1),
  message: z.string().trim().min(1),
  href: z.string().optional(),
});

export async function handleCreateNotification(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const parsed = createNotificationSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
      return;
    }

    const notification = await createNotification({
      userId: dbUserId,
      type: parsed.data.type,
      title: parsed.data.title,
      message: parsed.data.message,
      href: parsed.data.href,
    });

    res.status(201).json({
      notification: formatNotification(notification),
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
}

function getRouteId(req: Request): string | null {
  const raw = req.params.id;
  if (typeof raw === "string") {
    return raw;
  }

  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }

  return null;
}

export async function handleMarkNotificationRead(req: Request, res: Response) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;
    const id = getRouteId(req);

    if (!id) {
      res.status(400).json({ error: "Invalid notification id" });
      return;
    }

    const notification = await prisma.notification.findFirst({
      where: { id, userId: dbUserId },
    });

    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    await cacheDel(CACHE_KEYS.notificationsList(dbUserId));
    await cacheDel(CACHE_KEYS.notificationsUnreadCount(dbUserId));

    res.json({ notification: formatNotification(updated) });
  } catch (error) {
    console.error("Failed to mark notification read:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
}

export async function handleMarkAllNotificationsRead(
  req: Request,
  res: Response,
) {
  try {
    const { dbUserId } = req as AuthenticatedRequest;

    await prisma.notification.updateMany({
      where: { userId: dbUserId, read: false },
      data: { read: true },
    });

    await cacheDel(CACHE_KEYS.notificationsList(dbUserId));
    await cacheDel(CACHE_KEYS.notificationsUnreadCount(dbUserId));

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to mark all notifications read:", error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
}
