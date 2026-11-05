
import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { notificationService } from "../../services/notification.service";
import type {
  Notification,
  NotificationMarkAllReadResponse,
  NotificationMarkReadResponse,
} from "../../types/notification";

const PAGE_SIZE = 10;

type NotificationFilter = "all" | "unread" | "read";

function formatDate(date: string): string {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getNotificationLabel(type: Notification["notification_type"]): string {
  const labels: Record<Notification["notification_type"], string> = {
    follow_up_due: "Follow-up Due",
    follow_up_reminder: "Follow-up Reminder",
    follow_up_overdue: "Follow-up Overdue",
    system: "System",
  };

  return labels[type];
}

function getNotificationStyle(type: Notification["notification_type"]): string {
  const styles: Record<Notification["notification_type"], string> = {
    follow_up_due: "bg-amber-50 text-amber-700",
    follow_up_reminder: "bg-blue-50 text-blue-700",
    follow_up_overdue: "bg-red-50 text-red-700",
    system: "bg-slate-100 text-slate-700",
  };

  return styles[type];
}

function WorkerNotifications() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [search, setSearch] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["worker-notifications", page],
    queryFn: () =>
      notificationService.getMyNotifications({
        page,
        page_size: PAGE_SIZE,
      }),
  });

  const markReadMutation = useMutation<
    NotificationMarkReadResponse,
    Error,
    string
  >({
    mutationFn: (notificationId) =>
      notificationService.markAsRead(notificationId),
    onSuccess: () => {
      toast.success("Notification marked as read.");
      queryClient.invalidateQueries({
        queryKey: ["worker-notifications"],
      });
    },
    onError: (mutationError) => {
      toast.error(mutationError.message || "Unable to update notification.");
    },
  });

  const markAllReadMutation = useMutation<
    NotificationMarkAllReadResponse,
    Error,
    void
  >({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["worker-notifications"],
      });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError.message || "Unable to mark notifications as read.",
      );
    },
  });

  const notifications = data?.notifications ?? [];

  const filteredNotifications = notifications.filter((notification) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && !notification.is_read) ||
      (filter === "read" && notification.is_read);

    const searchText =
      `${notification.title} ${notification.message} ${notification.notification_type}`.toLowerCase();

    return matchesFilter && searchText.includes(search.toLowerCase());
  });

  const unreadCount = data?.unread_count ?? 0;
  const totalPages = data?.total_pages ?? 1;

  const handleFilterChange = (nextFilter: NotificationFilter) => {
    setFilter(nextFilter);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  const handleMarkAsRead = (notificationId: string) => {
    markReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllReadMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Stay updated on maternal care follow-ups and important alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={isFetching ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[#087f8c] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#066b76] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck size={16} />
            {markAllReadMutation.isPending
              ? "Updating..."
              : "Mark All as Read"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Total Notifications
            </p>
            <Bell className="text-slate-400" size={20} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">
            {data?.total ?? 0}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Unread Notifications
            </p>
            <BellRing className="text-amber-500" size={20} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">
            {unreadCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Read Notifications
            </p>
            <CheckCheck className="text-emerald-500" size={20} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">
            {Math.max(0, (data?.total ?? 0) - unreadCount)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "unread", "read"] as NotificationFilter[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleFilterChange(item)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                    filter === item
                      ? "bg-[#087f8c] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <div className="relative w-full lg:max-w-xs">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notifications..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/10"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">
            Recent Notifications
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {data?.total ?? 0} notifications available
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#087f8c] border-t-transparent" />
            <p className="text-sm text-slate-500">
              Loading notifications...
            </p>
          </div>
        ) : isError ? (
          <div className="px-5 py-14 text-center">
            <Bell className="mx-auto text-red-400" size={32} />
            <p className="mt-3 font-medium text-slate-700">
              Unable to load notifications
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {error instanceof Error
                ? error.message
                : "Something went wrong while fetching notifications."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-lg bg-[#087f8c] px-4 py-2 text-sm font-medium text-white hover:bg-[#066b76]"
            >
              Try Again
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Bell className="mx-auto text-slate-300" size={38} />
            <p className="mt-3 font-medium text-slate-700">
              No notifications found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {search || filter !== "all"
                ? "Try changing your search or filter."
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex flex-col gap-4 px-5 py-5 transition hover:bg-slate-50 sm:flex-row sm:items-start sm:justify-between ${
                  !notification.is_read ? "bg-[#f0fafa]/50" : ""
                }`}
              >
                <div className="flex min-w-0 gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      !notification.is_read
                        ? "bg-[#dff4f3] text-[#087f8c]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Bell size={20} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-800">
                        {notification.title}
                      </h3>

                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-[#087f8c]" />
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {notification.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getNotificationStyle(
                          notification.notification_type,
                        )}`}
                      >
                        {getNotificationLabel(
                          notification.notification_type,
                        )}
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock size={13} />
                        {formatDate(notification.created_at)}
                      </span>

                      {notification.is_read && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <Check size={13} />
                          Read
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!notification.is_read && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(notification.id)}
                    disabled={markReadMutation.isPending}
                    className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-[#087f8c]/30 px-3 py-2 text-sm font-medium text-[#087f8c] transition hover:bg-[#087f8c] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
                  >
                    <Check size={15} />
                    Mark as Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkerNotifications;
