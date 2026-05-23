import { fetchNotifications } from "./api";
import { useNotificationsStore } from "@/stores/notifications-store";

export async function refreshNotificationsStore(
  getToken: () => Promise<string | null>,
) {
  try {
    const token = await getToken();
    const data = await fetchNotifications(token);
    useNotificationsStore
      .getState()
      .setNotifications(data.notifications, data.unreadCount);
  } catch {
    // Notification refresh is best-effort.
  }
}
