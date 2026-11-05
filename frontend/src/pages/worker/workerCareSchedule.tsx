import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ClipboardList, RefreshCw } from "lucide-react";
import { workerScheduleService } from "../../services/workerSchedule.service";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) =>
    char.toUpperCase(),
  );
}

export default function WorkerCareSchedule() {
  const {
    data: schedule,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["worker-care-schedule"],
    queryFn: workerScheduleService.getMySchedule,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Loading your care schedule...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="font-medium text-red-700">
          Unable to load your care schedule.
        </p>
        <p className="mt-1 text-sm text-red-600">
          {error instanceof Error ? error.message : "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const antenatalVisits = schedule?.antenatal_visits ?? [];
  const followUpTasks = schedule?.follow_up_tasks ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Care Schedule
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View your accessible antenatal visits and assigned follow-up tasks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={isFetching ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Antenatal Visits
            </p>
            <CalendarDays className="text-blue-600" size={21} />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {antenatalVisits.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Accessible through your assigned facilities
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Assigned Follow-ups
            </p>
            <ClipboardList className="text-violet-600" size={21} />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {followUpTasks.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Tasks assigned to you
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Antenatal Visits
          </h2>
          <p className="text-sm text-slate-500">
            Antenatal visits available within your facility assignments.
          </p>
        </div>

        {antenatalVisits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <CalendarDays className="mx-auto text-slate-400" size={28} />
            <p className="mt-3 font-medium text-slate-700">
              No antenatal visits found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              No accessible antenatal visit records are currently available.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {antenatalVisits.map((visit) => (
              <article
                key={visit.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {formatStatus(visit.visit_type)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Visit date: {formatDate(visit.visit_date)}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {formatStatus(visit.follow_up_status)}
                  </span>
                </div>

                {visit.next_follow_up_date && (
                  <p className="mt-4 text-sm text-slate-600">
                    Next follow-up:{" "}
                    <span className="font-medium text-slate-900">
                      {formatDate(visit.next_follow_up_date)}
                    </span>
                  </p>
                )}

                {visit.notes && (
                  <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-500">
                    {visit.notes}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Assigned Follow-up Tasks
          </h2>
          <p className="text-sm text-slate-500">
            Follow-up tasks assigned to your healthcare worker account.
          </p>
        </div>

        {followUpTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <ClipboardList className="mx-auto text-slate-400" size={28} />
            <p className="mt-3 font-medium text-slate-700">
              No follow-up tasks found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              You currently have no assigned follow-up tasks.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {followUpTasks.map((task) => (
              <article
                key={task.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {formatStatus(task.task_type)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Due date: {formatDate(task.due_date)}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                    {formatStatus(task.task_status)}
                  </span>
                </div>

                {task.notes && (
                  <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-500">
                    {task.notes}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}