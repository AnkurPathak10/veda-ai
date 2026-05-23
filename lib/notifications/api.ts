import { API_BASE_URL } from "@/lib/create-assignment/constants";
import type {
  CreateNotificationPayload,
  CreateNotificationResponse,
  ListNotificationsResponse,
  NotificationItem,
} from "./types";

type ApiError = {
  error?: string;
};

async function parseJson<T>(response: Response): Promise<T & ApiError> {
  return (await response.json()) as T & ApiError;
}

export async function fetchNotifications(
  token: string | null,
): Promise<ListNotificationsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await parseJson<ListNotificationsResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to load notifications");
  }

  return data;
}

export async function createNotification(
  payload: CreateNotificationPayload,
  token: string | null,
): Promise<NotificationItem> {
  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson<CreateNotificationResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to create notification");
  }

  return data.notification;
}

export async function markNotificationRead(
  id: string,
  token: string | null,
): Promise<NotificationItem> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await parseJson<{ notification: NotificationItem }>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to update notification");
  }

  return data.notification;
}

export async function markAllNotificationsRead(
  token: string | null,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await parseJson<{ success?: boolean }>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to update notifications");
  }
}
