
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Info,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { notificationService } from "../../services/notification.service";
import type {
  AdminNotificationListResponse,
  Notification,
  NotificationType,
} from "../../types/notification";

const PAGE_SIZE = 10;

const notificationTypeLabels: Record<NotificationType, string> = {
  follow_up_due: "Follow-up Due",
  follow_up_reminder: "Follow-up Reminder",
  follow_up_overdue: "Follow-up Overdue",
  system: "System",
};

const notificationIcons: Record<NotificationType, LucideIcon> = {
  follow_up_due: CalendarClock,
  follow_up_reminder: Clock3,
  follow_up_overdue: AlertCircle,
  system: Info,
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNotificationStyle(type: NotificationType): string {
  switch (type) {
    case "follow_up_overdue":
      return "bg-red-50 text-red-700";
    case "follow_up_due":
      return "bg-amber-50 text-amber-700";
    case "follow_up_reminder":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function NotificationDetailsModal({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) {
  const Icon = notificationIcons[notification.notification_type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-detail-title"
        className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-xl p-3 ${getNotificationStyle(notification.notification_type)}`}
            >
              <Icon size={22} />
            </div>
            <div>
              <h2
                id="notification-detail-title"
                className="text-lg font-bold text-slate-900"
              >
                Notification details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {notificationTypeLabels[notification.notification_type]}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification details"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Title
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {notification.title}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Message
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {notification.message}
            </p>
          </div>

          <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-400">Notification ID</p>
              <p className="mt-1 break-all text-xs font-medium text-slate-700">
                {notification.id}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Recipient user ID</p>
              <p className="mt-1 break-all text-xs font-medium text-slate-700">
                {notification.recipient_user_id}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Related follow-up task</p>
              <p className="mt-1 break-all text-xs font-medium text-slate-700">
                {notification.related_follow_up_task_id ?? "Not linked"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Created at</p>
              <p className="mt-1 text-xs font-medium text-slate-700">
                {formatDate(notification.created_at)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Read status</p>
              <p className="mt-1 text-xs font-medium text-slate-700">
                {notification.is_read ? "Read" : "Unread"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Read at</p>
              <p className="mt-1 text-xs font-medium text-slate-700">
                {notification.read_at
                  ? formatDate(notification.read_at)
                  : "Not read"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");

  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(async () => {
      try {
        const response: AdminNotificationListResponse =
          await notificationService.getAdminNotifications(page, PAGE_SIZE);

        if (cancelled) return;

        setNotifications(response.notifications);
        setTotal(response.total);
        setError("");
      } catch {
        if (cancelled) return;
        setError("Unable to load notifications. Please try again.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [page, refreshKey]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        notification.title.toLowerCase().includes(searchValue) ||
        notification.message.toLowerCase().includes(searchValue) ||
        notification.id.toLowerCase().includes(searchValue) ||
        notification.recipient_user_id.toLowerCase().includes(searchValue);

      const matchesType =
        typeFilter === "all" ||
        notification.notification_type === typeFilter;

      const matchesRead =
        readFilter === "all" ||
        (readFilter === "read" && notification.is_read) ||
        (readFilter === "unread" && !notification.is_read);

      return matchesSearch && matchesType && matchesRead;
    });
  }, [notifications, search, typeFilter, readFilter]);

  const unreadOnPage = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  const readOnPage = notifications.filter(
    (notification) => notification.is_read,
  ).length;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleRefresh = () => {
    setLoading(true);
    setError("");
    setRefreshKey((current) => current + 1);
  };

  const handleViewDetails = async (notification: Notification) => {
    setSelectedNotification(notification);
    setDetailLoading(true);
    setDetailError("");

    try {
      const details = await notificationService.getAdminNotification(
        notification.id,
      );
      setSelectedNotification(details);
    } catch {
      setDetailError(
        "Unable to retrieve the latest notification details. Showing the available list information.",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f5f8f8]">
      <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Admin</span>
            <span>/</span>
            <span className="text-teal-700">Notifications</span>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Review system alerts and maternal care follow-up notifications.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Total notifications
              </p>
              <Bell className="text-teal-700" size={20} />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
              {total}
            </p>
            <p className="mt-1 text-xs text-slate-400">Across all pages</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Unread on this page
              </p>
              <AlertCircle className="text-amber-600" size={20} />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
              {unreadOnPage}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Current page only
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Read on this page
              </p>
              <CheckCircle2 className="text-emerald-600" size={20} />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
              {readOnPage}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Current page only
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, message, notification ID or recipient..."
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-600"
              >
                <option value="all">All notification types</option>
                <option value="follow_up_due">Follow-up Due</option>
                <option value="follow_up_reminder">Follow-up Reminder</option>
                <option value="follow_up_overdue">Follow-up Overdue</option>
                <option value="system">System</option>
              </select>

              <select
                value={readFilter}
                onChange={(event) => setReadFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-600"
              >
                <option value="all">All read statuses</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="m-5 flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div className="flex-1">{error}</div>
              <button
                type="button"
                onClick={handleRefresh}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
              <p className="text-sm text-slate-500">
                Loading notifications...
              </p>
            </div>
          ) : error ? null : filteredNotifications.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <Bell size={26} className="text-slate-400" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-800">
                No notifications found
              </h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {notifications.length === 0
                  ? "There are currently no notifications available."
                  : "Try changing your search term or filters."}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {filteredNotifications.map((notification) => {
                  const Icon =
                    notificationIcons[notification.notification_type];

                  return (
                    <div
                      key={notification.id}
                      className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-start"
                    >
                      <div
                        className={`h-fit rounded-xl p-3 ${getNotificationStyle(notification.notification_type)}`}
                      >
                        <Icon size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {notification.title}
                          </h3>

                          {!notification.is_read && (
                            <span className="h-2 w-2 rounded-full bg-teal-600" />
                          )}

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getNotificationStyle(notification.notification_type)}`}
                          >
                            {notificationTypeLabels[notification.notification_type]}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              notification.is_read
                                ? "bg-slate-100 text-slate-600"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {notification.is_read ? "Read" : "Unread"}
                          </span>
                        </div>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                          {notification.message}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                          <span>
                            {formatDate(notification.created_at)}
                          </span>
                          <span>
                            Recipient: {notification.recipient_user_id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleViewDetails(notification)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                      >
                        <Eye size={16} />
                        View details
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-800">
                    {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                  </span>
                  {" "}to{" "}
                  <span className="font-semibold text-slate-800">
                    {Math.min(page * PAGE_SIZE, total)}
                  </span>
                  {" "}of{" "}
                  <span className="font-semibold text-slate-800">
                    {total}
                  </span>
                  {" "}notifications
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <span className="px-2 text-sm font-medium text-slate-700">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {selectedNotification && (
        <NotificationDetailsModal
          notification={selectedNotification}
          onClose={() => {
            setSelectedNotification(null);
            setDetailError("");
          }}
        />
      )}

      {selectedNotification && detailLoading && (
        <div className="fixed bottom-5 right-5 z-[60] rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          Refreshing notification details...
        </div>
      )}

      {selectedNotification && detailError && (
        <div className="fixed bottom-5 right-5 z-[60] max-w-sm rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-lg">
          {detailError}
        </div>
      )}
    </div>
  );
}
