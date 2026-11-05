
export type NotificationType =
  | "follow_up_due"
  | "follow_up_reminder"
  | "follow_up_overdue"
  | "system";

export interface Notification {
  id: string;
  recipient_user_id: string;
  related_follow_up_task_id: string | null;
  title: string;
  message: string;
  notification_type: NotificationType;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AdminNotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface NotificationMarkReadResponse {
  id: string;
  is_read: boolean;
  read_at: string | null;
}

export interface NotificationMarkAllReadResponse {
  message: string;
  updated_count: number;
}

export interface NotificationListParams {
  page?: number;
  page_size?: number;
}
