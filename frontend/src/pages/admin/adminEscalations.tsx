
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { followUpEscalationService } from "../../services/followUpEscalation.service";
import type {
  EscalationStatus,
  FollowUpEscalation,
} from "../../types/followUpEscalation";

const PAGE_SIZE = 10;

const statusStyles: Record<EscalationStatus, string> = {
  open: "bg-rose-50 text-rose-700 ring-rose-200",
  acknowledged: "bg-amber-50 text-amber-700 ring-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function formatTimestamp(value: string | null): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function shortenId(value: string, length = 8): string {
  return `${value.slice(0, length)}…`;
}

function StatusBadge({ status }: { status: EscalationStatus }) {
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
  icon: typeof ShieldAlert;
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

function EscalationDetailsModal({
  escalation,
  onClose,
}: {
  escalation: FollowUpEscalation;
  onClose: () => void;
}) {
  const details = [
    { label: "Escalation ID", value: escalation.id },
    { label: "Follow-up task ID", value: escalation.follow_up_task_id },
    { label: "Facility ID", value: escalation.facility_id },
    { label: "Assigned supervisor ID", value: escalation.escalated_to_worker_id },
    { label: "Escalation level", value: String(escalation.escalation_level) },
    { label: "Escalated at", value: formatTimestamp(escalation.escalated_at) },
    { label: "Acknowledged at", value: formatTimestamp(escalation.acknowledged_at) },
    { label: "Resolved at", value: formatTimestamp(escalation.resolved_at) },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="escalation-details-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2
              id="escalation-details-title"
              className="text-lg font-bold text-slate-900"
            >
              Escalation Details
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Complete escalation record
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close escalation details"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Escalation reference
              </p>
              <p className="mt-1 break-all font-mono text-sm text-slate-700">
                {escalation.id}
              </p>
            </div>

            <StatusBadge status={escalation.escalation_status} />
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
                <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={17} className="text-rose-600" />
              <h3 className="text-sm font-semibold text-slate-800">
                Escalation reason
              </h3>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {escalation.escalation_reason}
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

export default function AdminEscalations() {
  const [escalations, setEscalations] = useState<FollowUpEscalation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | EscalationStatus
  >("all");
  const [selectedEscalation, setSelectedEscalation] =
    useState<FollowUpEscalation | null>(null);

  useEffect(() => {
    let cancelled = false;

    followUpEscalationService
      .getAdminEscalations(page, PAGE_SIZE)
      .then((response) => {
        if (!cancelled) {
          setEscalations(response.escalations);
          setTotal(response.total);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to load escalations. Please try again.");
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
  }, [page, refreshKey]);

  const summary = useMemo(() => {
    return {
      open: escalations.filter(
        (item) => item.escalation_status === "open",
      ).length,
      acknowledged: escalations.filter(
        (item) => item.escalation_status === "acknowledged",
      ).length,
      resolved: escalations.filter(
        (item) => item.escalation_status === "resolved",
      ).length,
    };
  }, [escalations]);

  const filteredEscalations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return escalations.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ||
        item.escalation_status === statusFilter;

      const searchableValues = [
        item.id,
        item.follow_up_task_id,
        item.facility_id,
        item.escalated_to_worker_id,
        item.escalation_reason,
        item.escalation_status,
        String(item.escalation_level),
      ];

      const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );

      return matchesStatus && matchesSearch;
    });
  }, [escalations, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey((value) => value + 1);
  };

  const handlePageChange = (nextPage: number) => {
    setLoading(true);
    setPage(nextPage);
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Admin</span>
            <span>/</span>
            <span className="text-teal-700">Escalations</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Escalation Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Monitor overdue maternal care follow-ups escalated to facility
            supervisors and review their resolution status.
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total escalations"
          value={total}
          icon={ShieldAlert}
          iconClass="bg-teal-50 text-teal-700"
        />

        <SummaryCard
          label="Open on current page"
          value={summary.open}
          icon={AlertCircle}
          iconClass="bg-rose-50 text-rose-700"
        />

        <SummaryCard
          label="Acknowledged on current page"
          value={summary.acknowledged}
          icon={Clock3}
          iconClass="bg-amber-50 text-amber-700"
        />

        <SummaryCard
          label="Resolved on current page"
          value={summary.resolved}
          icon={CheckCircle2}
          iconClass="bg-emerald-50 text-emerald-700"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Escalation records
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Showing backend records for page {page}. Search and status
                filters apply to the current page.
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
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search escalation, task, facility..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "all" | EscalationStatus,
                  )
                }
                aria-label="Filter escalations by status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
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
              Loading escalation records...
            </p>
          </div>
        ) : error && escalations.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
            <AlertCircle size={28} className="text-rose-500" />
            <h3 className="mt-3 font-semibold text-slate-800">
              Unable to retrieve records
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Check your connection and try refreshing the page.
            </p>
          </div>
        ) : escalations.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <div className="rounded-2xl bg-slate-100 p-4">
              <ShieldAlert size={28} className="text-slate-500" />
            </div>

            <h3 className="mt-4 font-semibold text-slate-800">
              No escalations found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Escalation records will appear here when they are generated by
              the backend.
            </p>
          </div>
        ) : filteredEscalations.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
            <Search size={26} className="text-slate-400" />

            <h3 className="mt-3 font-semibold text-slate-800">
              No matching escalations
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try another search term or status filter.
            </p>

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
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">Escalation</th>
                    <th className="px-5 py-4">Follow-up task</th>
                    <th className="px-5 py-4">Supervisor</th>
                    <th className="px-5 py-4">Facility</th>
                    <th className="px-5 py-4">Level</th>
                    <th className="px-5 py-4">Escalated at</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredEscalations.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          Escalation
                        </p>
                        <p className="mt-1 font-mono text-xs text-slate-400">
                          {shortenId(item.id)}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        {shortenId(item.follow_up_task_id)}
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        {shortenId(item.escalated_to_worker_id)}
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        {shortenId(item.facility_id)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-bold text-slate-700">
                          L{item.escalation_level}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatTimestamp(item.escalated_at)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={item.escalation_status} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEscalation(item)}
                          aria-label={`View escalation ${item.id}`}
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
                Showing page{" "}
                <span className="font-semibold text-slate-800">{page}</span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800">
                  {totalPages}
                </span>
                {" · "}
                <span className="font-semibold text-slate-800">{total}</span>{" "}
                total escalations
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => handlePageChange(page - 1)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="min-w-20 text-center text-sm text-slate-600">
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => handlePageChange(page + 1)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {selectedEscalation && (
        <EscalationDetailsModal
          escalation={selectedEscalation}
          onClose={() => setSelectedEscalation(null)}
        />
      )}
    </div>
  );
}
