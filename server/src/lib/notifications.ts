import { CACHE_KEYS, cacheDel } from "./cache.js";
import { prisma } from "./prisma.js";

type CreateNotificationInput = {
  userId: string;
  type?: "SUCCESS" | "ERROR" | "INFO";
  title: string;
  message: string;
  href?: string;
};

export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type ?? "INFO",
      title: input.title,
      message: input.message,
      href: input.href ?? null,
    },
  });

  await cacheDel(CACHE_KEYS.notificationsList(input.userId));
  await cacheDel(CACHE_KEYS.notificationsUnreadCount(input.userId));

  return notification;
}

export async function createNotificationsForUsers(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId">,
) {
  const uniqueUserIds = [...new Set(userIds)];

  await Promise.all(
    uniqueUserIds.map((userId) =>
      createNotification({
        userId,
        ...input,
      }),
    ),
  );
}
