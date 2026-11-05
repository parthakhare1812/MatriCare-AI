
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

import { followUpTaskService } from "../../services/followUpTask.service";
import WorkerFollowUpTaskForm from "../../components/forms/WorkerFollowUpTaskForm";

import type {
  FollowUpTask,
  TaskStatus,
} from "../../types/followUpTask";

const statusOptions: {
  label: string;
  value: TaskStatus | "all";
}[] = [
  { label: "All Tasks", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Missed", value: "missed" },
  { label: "Cancelled", value: "cancelled" },
];

const statusStyles: Record<TaskStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  missed: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const WorkerFollowUpTasks = () => {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadTasks = useCallback(async () => {
    setRefreshing(true);
    setError("");

    try {
      const data = await followUpTaskService.getAssignedTasks();
      setTasks(data);
    } catch {
      setError("Unable to load follow-up tasks. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    followUpTaskService
      .getAssignedTasks()
      .then((data) => {
        if (isActive) {
          setTasks(data);
        }
      })
      .catch(() => {
        if (isActive) {
          setError("Unable to load follow-up tasks. Please try again.");
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesStatus =
        statusFilter === "all" || task.task_status === statusFilter;

      const matchesSearch =
        !query ||
        task.task_type.toLowerCase().includes(query) ||
        (task.notes ?? "").toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [tasks, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter((task) => task.task_status === "pending").length,
      completed: tasks.filter((task) => task.task_status === "completed").length,
      missed: tasks.filter((task) => task.task_status === "missed").length,
    };
  }, [tasks]);

  const handleStatusUpdate = async (
    task: FollowUpTask,
    nextStatus: TaskStatus,
  ) => {
    if (task.task_status === nextStatus) return;

    setUpdatingTaskId(task.id);
    setError("");

    try {
      const updatedTask = await followUpTaskService.updateTask(task.id, {
        task_status: nextStatus,
      });

      setTasks((current) =>
        current.map((item) =>
          item.id === updatedTask.id ? updatedTask : item,
        ),
      );
    } catch {
      setError(`Unable to update "${task.task_type}". Please try again.`);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleTaskCreated = (task: FollowUpTask) => {
    setTasks((current) => [task, ...current]);
    setShowCreateForm(false);
    setError("");
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-700">
              <ClipboardList size={16} />
              Care Coordination
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Follow-up Tasks
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage and track your assigned maternal care follow-ups.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              <Plus size={17} />
              Create Follow-up Task
            </button>

            <button
              type="button"
              onClick={() => void loadTasks()}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Tasks",
              value: counts.total,
              icon: ClipboardList,
              style: "bg-teal-50 text-teal-700",
            },
            {
              label: "Pending",
              value: counts.pending,
              icon: Clock3,
              style: "bg-amber-50 text-amber-700",
            },
            {
              label: "Completed",
              value: counts.completed,
              icon: CheckCircle2,
              style: "bg-emerald-50 text-emerald-700",
            },
            {
              label: "Missed",
              value: counts.missed,
              icon: AlertCircle,
              style: "bg-rose-50 text-rose-700",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    {item.label}
                  </p>
                  <div className={`rounded-xl p-2.5 ${item.style}`}>
                    <Icon size={19} />
                  </div>
                </div>

                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                  {loading ? "—" : item.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search task type or notes..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    statusFilter === option.value
                      ? "bg-teal-700 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <Loader2 size={30} className="animate-spin text-teal-700" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              Loading your follow-up tasks...
            </p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
            <div className="rounded-2xl bg-slate-100 p-4">
              <ClipboardList size={28} className="text-slate-500" />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              {tasks.length === 0
                ? "No follow-up tasks assigned"
                : "No matching tasks found"}
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              {tasks.length === 0
                ? "Your assigned follow-up tasks will appear here when they become available."
                : "Try changing your search term or selecting a different status."}
            </p>

            {(search || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="mt-4 text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-bold text-slate-900">
                      {task.task_type}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Task ID: {task.id}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                      statusStyles[task.task_status]
                    }`}
                  >
                    {task.task_status.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <CalendarDays
                      size={18}
                      className="shrink-0 text-teal-700"
                    />
                    <div>
                      <p className="text-xs text-slate-500">Due date</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {formatDate(task.due_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <Clock3
                      size={18}
                      className="shrink-0 text-teal-700"
                    />
                    <div>
                      <p className="text-xs text-slate-500">Created on</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {formatDate(task.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {task.notes && (
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-xs font-semibold text-slate-500">
                      Notes
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                      {task.notes}
                    </p>
                  </div>
                )}

                {task.completed_at && (
                  <p className="mt-3 text-xs text-emerald-700">
                    Completed:{" "}
                    {new Date(task.completed_at).toLocaleString("en-IN")}
                  </p>
                )}

                <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-medium text-slate-500">
                    Update task status
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {task.task_status !== "completed" && (
                      <button
                        type="button"
                        disabled={updatingTaskId === task.id}
                        onClick={() =>
                          void handleStatusUpdate(task, "completed")
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                      >
                        {updatingTaskId === task.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        Complete
                      </button>
                    )}

                    {task.task_status !== "missed" && (
                      <button
                        type="button"
                        disabled={updatingTaskId === task.id}
                        onClick={() =>
                          void handleStatusUpdate(task, "missed")
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        Mark Missed
                      </button>
                    )}

                    {task.task_status !== "pending" && (
                      <button
                        type="button"
                        disabled={updatingTaskId === task.id}
                        onClick={() =>
                          void handleStatusUpdate(task, "pending")
                        }
                        className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateForm && (
        <WorkerFollowUpTaskForm
          onSuccess={handleTaskCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
};

export default WorkerFollowUpTasks;
