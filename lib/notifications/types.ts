export type NotificationType = "SUCCESS" | "ERROR" | "INFO";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export type ListNotificationsResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export type CreateNotificationPayload = {
  type?: NotificationType;
  title: string;
  message: string;
  href?: string;
};

export type CreateNotificationResponse = {
  notification: NotificationItem;
};
