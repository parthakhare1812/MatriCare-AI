
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { followUpEscalationService } from "../../services/followUpEscalation.service";
import type {
  EscalationStatus,
  FollowUpEscalation,
} from "../../types/followUpEscalation";

type StatusFilter = "all" | EscalationStatus;

const PAGE_SIZE = 10;

function formatDate(value: string | null): string {
  if (!value) return "Not yet recorded";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status: EscalationStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusStyle(status: EscalationStatus): string {
  switch (status) {
    case "open":
      return "bg-red-50 text-red-700";
    case "acknowledged":
      return "bg-amber-50 text-amber-700";
    case "resolved":
      return "bg-emerald-50 text-emerald-700";
  }
}

function WorkerEscalations() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedEscalation, setSelectedEscalation] =
    useState<FollowUpEscalation | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["worker-escalations", page],
    queryFn: () =>
      followUpEscalationService.getMyEscalations({
        page,
        page_size: PAGE_SIZE,
      }),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: followUpEscalationService.acknowledgeEscalation,
    onSuccess: (response) => {
      toast.success(response.message);
      setSelectedEscalation(response.escalation);
      queryClient.invalidateQueries({
        queryKey: ["worker-escalations"],
      });
    },
    onError: () => {
      toast.error("Unable to acknowledge escalation.");
    },
  });

  const resolveMutation = useMutation({
    mutationFn: followUpEscalationService.resolveEscalation,
    onSuccess: (response) => {
      toast.success(response.message);
      setSelectedEscalation(response.escalation);
      queryClient.invalidateQueries({
        queryKey: ["worker-escalations"],
      });
    },
    onError: () => {
      toast.error("Unable to resolve escalation.");
    },
  });

  const escalations = useMemo(
  () => data?.escalations ?? [],
  [data?.escalations],
);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filteredEscalations = useMemo(() => {
    return escalations.filter((escalation) => {
      const matchesStatus =
        statusFilter === "all" ||
        escalation.escalation_status === statusFilter;

      const matchesSearch =
        escalation.escalation_reason
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        escalation.follow_up_task_id
          .toLowerCase()
          .includes(search.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [escalations, search, statusFilter]);

  const openCount = escalations.filter(
    (item) => item.escalation_status === "open",
  ).length;

  const acknowledgedCount = escalations.filter(
    (item) => item.escalation_status === "acknowledged",
  ).length;

  const resolvedCount = escalations.filter(
    (item) => item.escalation_status === "resolved",
  ).length;

  const handleStatusChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSelectEscalation = async (escalation: FollowUpEscalation) => {
    try {
      const details = await followUpEscalationService.getEscalation(
        escalation.id,
      );
      setSelectedEscalation(details);
    } catch {
      toast.error("Unable to load escalation details.");
    }
  };

  const isActionPending =
    acknowledgeMutation.isPending || resolveMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-slate-500">
          Loading escalation records...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="font-medium text-red-700">
          Unable to load escalations.
        </p>
        <p className="mt-1 text-sm text-red-600">
          {error instanceof Error
            ? error.message
            : "An unexpected error occurred."}
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Escalations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review, acknowledge and resolve your assigned follow-up escalations.
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Open Escalations
            </p>
            <AlertTriangle className="text-red-600" size={21} />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {openCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Acknowledged
            </p>
            <ShieldCheck className="text-amber-600" size={21} />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {acknowledgedCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Resolved
            </p>
            <CheckCircle2 className="text-emerald-600" size={21} />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {resolvedCount}
          </p>
        </div>
      </div>

      <section className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search reason or task ID..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              ["all", "open", "acknowledged", "resolved"] as StatusFilter[]
            ).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusChange(status)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  statusFilter === status
                    ? "bg-[#087f8c] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {status === "all" ? "All" : formatStatus(status)}
              </button>
            ))}
          </div>
        </div>

        {filteredEscalations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <AlertTriangle
              className="mx-auto text-slate-400"
              size={30}
            />
            <p className="mt-3 font-medium text-slate-700">
              No escalations found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              No records match your current search or status filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEscalations.map((escalation) => (
              <article
                key={escalation.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        Escalation Level {escalation.escalation_level}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                          escalation.escalation_status,
                        )}`}
                      >
                        {formatStatus(escalation.escalation_status)}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {escalation.escalation_reason}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                      <span>
                        Task ID: {escalation.follow_up_task_id}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={13} />
                        {formatDate(escalation.escalated_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectEscalation(escalation)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View Details
                    </button>

                    {escalation.escalation_status === "open" && (
                      <button
                        type="button"
                        disabled={isActionPending}
                        onClick={() =>
                          acknowledgeMutation.mutate(escalation.id)
                        }
                        className="rounded-lg bg-[#087f8c] px-3 py-2 text-sm font-medium text-white hover:bg-[#066b76] disabled:opacity-50"
                      >
                        Acknowledge
                      </button>
                    )}

                    {escalation.escalation_status !== "resolved" && (
                      <button
                        type="button"
                        disabled={isActionPending}
                        onClick={() =>
                          resolveMutation.mutate(escalation.id)
                        }
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-500">
              Showing page {page} of {totalPages} · {total} total escalations
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {selectedEscalation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="escalation-details-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id="escalation-details-title"
                className="text-lg font-semibold text-slate-900"
              >
                Escalation Details
              </h2>
              <button
                type="button"
                onClick={() => setSelectedEscalation(null)}
                aria-label="Close escalation details"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Escalation reason
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {selectedEscalation.escalation_reason}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                      selectedEscalation.escalation_status,
                    )}`}
                  >
                    {formatStatus(selectedEscalation.escalation_status)}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Escalation level</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {selectedEscalation.escalation_level}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Follow-up task ID</p>
                  <p className="mt-1 break-all text-sm text-slate-800">
                    {selectedEscalation.follow_up_task_id}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Facility ID</p>
                  <p className="mt-1 break-all text-sm text-slate-800">
                    {selectedEscalation.facility_id}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Escalated at
                  </p>
                  <p className="mt-1 text-sm text-slate-800">
                    {formatDate(selectedEscalation.escalated_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Acknowledged at
                  </p>
                  <p className="mt-1 text-sm text-slate-800">
                    {formatDate(selectedEscalation.acknowledged_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Resolved at</p>
                  <p className="mt-1 text-sm text-slate-800">
                    {formatDate(selectedEscalation.resolved_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Escalated to worker ID
                  </p>
                  <p className="mt-1 break-all text-sm text-slate-800">
                    {selectedEscalation.escalated_to_worker_id}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedEscalation(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>

              {selectedEscalation.escalation_status === "open" && (
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={() =>
                    acknowledgeMutation.mutate(selectedEscalation.id)
                  }
                  className="rounded-lg bg-[#087f8c] px-4 py-2 text-sm font-medium text-white hover:bg-[#066b76] disabled:opacity-50"
                >
                  Acknowledge
                </button>
              )}

              {selectedEscalation.escalation_status !== "resolved" && (
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={() =>
                    resolveMutation.mutate(selectedEscalation.id)
                  }
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Resolve
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkerEscalations;
