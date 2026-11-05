
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  ListTodo,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { followUpTaskService } from "../../services/followUpTask.service";
import type {
  FollowUpTask,
  FollowUpTaskStatus,
} from "../../types/followUpTask";

type StatusFilter = "all" | FollowUpTaskStatus;

const PAGE_SIZE = 10;

const statusStyles: Record<FollowUpTaskStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  missed: "bg-rose-50 text-rose-700 ring-rose-200",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
};

function formatDate(value: string | null): string {
  if (!value) return "Not available";

  const datePart = value.split("T")[0];
  const parts = datePart.split("-").map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return "Invalid date";
  }

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "Invalid date";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimestamp(value: string | null): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function shortenId(value: string | null, length = 8): string {
  if (!value) return "—";
  return `${value.slice(0, length)}…`;
}

function StatusBadge({ status }: { status: FollowUpTaskStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: number;
  icon: typeof ListTodo;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value.toLocaleString("en-IN")}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function TaskDetailsModal({
  task,
  onClose,
}: {
  task: FollowUpTask;
  onClose: () => void;
}) {
  const details = [
    { label: "Task ID", value: task.id },
    { label: "Pregnancy ID", value: task.pregnancy_id },
    { label: "Antenatal visit ID", value: task.antenatal_visit_id },
    { label: "Facility ID", value: task.facility_id },
    { label: "Assigned worker ID", value: task.assigned_worker_id },
    { label: "Created by worker ID", value: task.created_by_worker_id },
    { label: "Task type", value: task.task_type },
    { label: "Due date", value: formatDate(task.due_date) },
    { label: "Status", value: task.task_status },
    { label: "Completed at", value: formatTimestamp(task.completed_at) },
    { label: "Created at", value: formatTimestamp(task.created_at) },
    { label: "Last updated", value: formatTimestamp(task.updated_at) },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-details-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2
              id="task-details-title"
              className="text-lg font-bold text-slate-900"
            >
              Follow-up Task Details
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Complete record information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close task details"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Task reference
              </p>
              <p className="mt-1 font-mono text-sm text-slate-700">
                {task.id}
              </p>
            </div>
            <StatusBadge status={task.task_status} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {details.map((item) => (
              <div
                key={item.label}
                className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <p className="text-xs font-medium text-slate-500">
                  {item.label}
                </p>
                <p className="mt-1 break-all text-sm font-semibold capitalize text-slate-800">
                  {item.value ?? "Not available"}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <FileText size={17} className="text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800">
                Notes
              </h3>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {task.notes || "No notes available for this task."}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-4 text-right">
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

export default function AdminFollowUpTasks() {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null);

  useEffect(() => {
    let cancelled = false;

    followUpTaskService
      .getAdminFollowUpTasks()
      .then((data) => {
        if (!cancelled) {
          setTasks(data);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to load follow-up tasks. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const summary = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter((task) => task.task_status === "pending").length,
      completed: tasks.filter((task) => task.task_status === "completed").length,
      missed: tasks.filter((task) => task.task_status === "missed").length,
      cancelled: tasks.filter((task) => task.task_status === "cancelled").length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesStatus =
        statusFilter === "all" || task.task_status === statusFilter;

      const searchableValues = [
        task.id,
        task.pregnancy_id,
        task.antenatal_visit_id ?? "",
        task.facility_id,
        task.assigned_worker_id,
        task.created_by_worker_id,
        task.task_type,
        task.task_status,
        task.notes ?? "",
      ];

      const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );

      return matchesStatus && matchesSearch;
    });
  }, [tasks, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / PAGE_SIZE),
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedTasks = filteredTasks.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey((value) => value + 1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: StatusFilter) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Admin</span>
            <span>/</span>
            <span className="text-teal-700">Follow-up Tasks</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Follow-up Task Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Monitor maternal care follow-up tasks and review their current
            status across facilities.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0 text-rose-600"
            />
            <p className="text-sm text-rose-700">{error}</p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="self-start text-sm font-semibold text-rose-700 underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Total tasks"
          value={summary.total}
          icon={ListTodo}
          iconClass="bg-teal-50 text-teal-700"
        />
        <SummaryCard
          label="Pending"
          value={summary.pending}
          icon={Clock3}
          iconClass="bg-amber-50 text-amber-700"
        />
        <SummaryCard
          label="Completed"
          value={summary.completed}
          icon={CheckCircle2}
          iconClass="bg-emerald-50 text-emerald-700"
        />
        <SummaryCard
          label="Missed"
          value={summary.missed}
          icon={AlertCircle}
          iconClass="bg-rose-50 text-rose-700"
        />
        <SummaryCard
          label="Cancelled"
          value={summary.cancelled}
          icon={XCircle}
          iconClass="bg-slate-100 text-slate-600"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Follow-up task records
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search and review tasks retrieved from the Admin API.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative flex-1 lg:w-80">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => handleSearch(event.target.value)}
                  placeholder="Search task, pregnancy, worker..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  handleStatusFilter(event.target.value as StatusFilter)
                }
                aria-label="Filter tasks by status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8">
            <RefreshCw
              size={26}
              className="animate-spin text-teal-600"
            />
            <p className="text-sm text-slate-500">
              Loading follow-up task records...
            </p>
          </div>
        ) : tasks.length === 0 && !error ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <div className="rounded-2xl bg-slate-100 p-4">
              <CalendarDays size={28} className="text-slate-500" />
            </div>

            <h3 className="mt-4 font-semibold text-slate-800">
              No follow-up tasks found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Follow-up task records will appear here when they are available
              through the backend.
            </p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
            <Search size={26} className="text-slate-400" />

            <h3 className="mt-3 font-semibold text-slate-800">
              No matching tasks
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search term or status filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className="mt-4 text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">Task</th>
                    <th className="px-5 py-4">Pregnancy ID</th>
                    <th className="px-5 py-4">Assigned worker</th>
                    <th className="px-5 py-4">Facility ID</th>
                    <th className="px-5 py-4">Due date</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {task.task_type}
                        </p>
                        <p className="mt-1 font-mono text-xs text-slate-400">
                          {shortenId(task.id)}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        {shortenId(task.pregnancy_id)}
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        {shortenId(task.assigned_worker_id)}
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        {shortenId(task.facility_id)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(task.due_date)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={task.task_status} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTask(task)}
                          aria-label={`View task ${task.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-800">
                  {(safePage - 1) * PAGE_SIZE + 1}–
                  {Math.min(safePage * PAGE_SIZE, filteredTasks.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800">
                  {filteredTasks.length}
                </span>{" "}
                tasks
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="min-w-20 text-center text-sm text-slate-600">
                  Page {safePage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
