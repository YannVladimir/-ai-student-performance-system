import { apiClient } from "./client";
import type { NotificationDto } from "../types";

export async function getNotifications(): Promise<NotificationDto[]> {
  const { data } = await apiClient.get<NotificationDto[]>("/notifications");
  return data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>("/notifications/unread-count");
  return data.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}
