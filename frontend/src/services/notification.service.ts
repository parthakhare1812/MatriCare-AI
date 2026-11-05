
import { api } from "../lib/api";
import type {
  AdminNotificationListResponse,
  Notification,
  NotificationListParams,
  NotificationListResponse,
  NotificationMarkAllReadResponse,
  NotificationMarkReadResponse,
} from "../types/notification";

interface AdminUnreadNotificationCountResponse {
  unread_count: number;
}

export const notificationService = {
  async getAdminNotifications(
    page = 1,
    pageSize = 10,
  ): Promise<AdminNotificationListResponse> {
    const response = await api.get<AdminNotificationListResponse>(
      "/admin/notifications/",
      {
        params: {
          page,
          page_size: pageSize,
        },
      },
    );

    return response.data;
  },

  async getAdminNotification(
    notificationId: string,
  ): Promise<Notification> {
    const response = await api.get<Notification>(
      `/admin/notifications/${notificationId}`,
    );

    return response.data;
  },

  async getAdminUnreadCount(): Promise<AdminUnreadNotificationCountResponse> {
    const response = await api.get<AdminUnreadNotificationCountResponse>(
      "/admin/notifications/unread-count",
    );

    return response.data;
  },

  async getMyNotifications(
    params: NotificationListParams = {},
  ): Promise<NotificationListResponse> {
    const response = await api.get<NotificationListResponse>(
      "/workers/me/notifications/",
      { params },
    );

    return response.data;
  },

  async markAsRead(
    notificationId: string,
  ): Promise<NotificationMarkReadResponse> {
    const response = await api.patch<NotificationMarkReadResponse>(
      `/workers/me/notifications/${notificationId}/read`,
    );

    return response.data;
  },

  async markAllAsRead(): Promise<NotificationMarkAllReadResponse> {
    const response = await api.patch<NotificationMarkAllReadResponse>(
      "/workers/me/notifications/read-all",
    );

    return response.data;
  },
};

export default notificationService;
