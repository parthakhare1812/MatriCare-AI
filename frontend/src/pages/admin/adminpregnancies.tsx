
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  HeartPulse,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import axios from "axios";

import { pregnancyService } from "../../services/pregnancy.service";
import type {
  Pregnancy,
  PregnancyStatus,
} from "../../types/pregnancy";

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (!error.response) {
      return "Unable to connect to the backend. Please check that the server is running.";
    }

    return error.message || "The request could not be completed.";
  }

  return "Something went wrong. Please try again.";
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  const datePart = value.split("T")[0];
  const parts = datePart.split("-");

  if (parts.length !== 3) {
    return "—";
  }

  const [year, month, day] = parts.map(Number);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusStyles(status: PregnancyStatus): string {
  const styles: Record<PregnancyStatus, string> = {
    ongoing: "bg-emerald-50 text-emerald-700",
    completed: "bg-blue-50 text-blue-700",
    loss: "bg-red-50 text-red-700",
    unknown: "bg-slate-100 text-slate-600",
  };

  return styles[status];
}

function StatusBadge({ status }: { status: PregnancyStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyles(status)}`}
    >
      {status}
    </span>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

function PregnancyDetailsModal({
  pregnancy,
  onClose,
}: {
  pregnancy: Pregnancy;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pregnancy-details-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Pregnancy record
            </p>
            <h2
              id="pregnancy-details-title"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              Pregnancy details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close pregnancy details"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <HeartPulse size={27} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-slate-900">
                Pregnancy record
              </h3>
              <p className="mt-1 break-all text-xs text-slate-500">
                ID: {pregnancy.id}
              </p>
            </div>

            <StatusBadge status={pregnancy.pregnancy_status} />
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-slate-700">
              <CalendarDays size={17} />
              <h3 className="text-sm font-semibold">Pregnancy timeline</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Last menstrual period"
                value={formatDate(pregnancy.last_menstrual_period)}
              />
              <DetailItem
                label="Estimated due date"
                value={formatDate(pregnancy.estimated_due_date)}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold text-slate-900">
              Associated records
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Maternal patient ID"
                value={pregnancy.maternal_patient_id}
              />
              <DetailItem
                label="Facility ID"
                value={pregnancy.facility_id}
              />
              <DetailItem
                label="Registered by worker ID"
                value={pregnancy.registered_by_worker_id}
              />
              <DetailItem
                label="Pregnancy status"
                value={pregnancy.pregnancy_status}
              />
            </div>
          </div>

          <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
            <DetailItem
              label="Created on"
              value={formatDateTime(pregnancy.created_at)}
            />
            <DetailItem
              label="Last updated"
              value={formatDateTime(pregnancy.updated_at)}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

function AdminPregnancies() {
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPregnancy, setSelectedPregnancy] =
    useState<Pregnancy | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const loadPregnancies = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await pregnancyService.getAdminPregnancies();
      setPregnancies(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      await Promise.resolve();

      if (!cancelled) {
        await loadPregnancies();
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [loadPregnancies]);

  const filteredPregnancies = useMemo(() => {
    const query = searchInput.trim().toLowerCase();

    return pregnancies.filter((pregnancy) => {
      const matchesSearch =
        !query ||
        pregnancy.id.toLowerCase().includes(query) ||
        pregnancy.maternal_patient_id.toLowerCase().includes(query) ||
        pregnancy.facility_id.toLowerCase().includes(query) ||
        pregnancy.registered_by_worker_id.toLowerCase().includes(query) ||
        pregnancy.pregnancy_status.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        pregnancy.pregnancy_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [pregnancies, searchInput, statusFilter]);

  const totalPages = Math.ceil(filteredPregnancies.length / PAGE_SIZE);

  const paginatedPregnancies = filteredPregnancies.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const statusCounts = useMemo(
    () => ({
      ongoing: pregnancies.filter(
        (item) => item.pregnancy_status === "ongoing",
      ).length,
      completed: pregnancies.filter(
        (item) => item.pregnancy_status === "completed",
      ).length,
      loss: pregnancies.filter(
        (item) => item.pregnancy_status === "loss",
      ).length,
      unknown: pregnancies.filter(
        (item) => item.pregnancy_status === "unknown",
      ).length,
    }),
    [pregnancies],
  );

  const handleViewPregnancy = async (pregnancyId: string) => {
    setIsDetailsLoading(true);
    setDetailsError("");

    try {
      const result =
        await pregnancyService.getAdminPregnancy(pregnancyId);

      setSelectedPregnancy(result);
    } catch (requestError) {
      setDetailsError(getErrorMessage(requestError));
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const firstRecord =
    filteredPregnancies.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;

  const lastRecord = Math.min(
    page * PAGE_SIZE,
    filteredPregnancies.length,
  );

  return (
    <main className="min-h-full bg-[#f5f8f8]">
      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
              <ShieldCheck size={15} />
              Admin workspace
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Pregnancy Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Monitor pregnancy records, review pregnancy timelines, and
              inspect associated maternal care records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadPregnancies()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-center"
          >
            <RefreshCw
              size={16}
              className={isLoading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center"
          >
            <AlertCircle size={20} className="shrink-0 text-red-600" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-800">
                Unable to load pregnancy records
              </p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => void loadPregnancies()}
              className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {detailsError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle size={17} />
            <span>{detailsError}</span>
            <button
              type="button"
              onClick={() => setDetailsError("")}
              aria-label="Dismiss error"
              className="ml-auto"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              {
                label: "Ongoing",
                value: statusCounts.ongoing,
                color: "text-emerald-700",
                background: "bg-emerald-50",
              },
              {
                label: "Completed",
                value: statusCounts.completed,
                color: "text-blue-700",
                background: "bg-blue-50",
              },
              {
                label: "Pregnancy loss",
                value: statusCounts.loss,
                color: "text-red-700",
                background: "bg-red-50",
              },
              {
                label: "Unknown status",
                value: statusCounts.unknown,
                color: "text-slate-700",
                background: "bg-slate-100",
              },
            ] as const
          ).map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {item.label}
                </p>

                <div className={`rounded-xl p-3 ${item.background} ${item.color}`}>
                  <HeartPulse size={20} />
                </div>
              </div>

              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {isLoading ? "—" : item.value.toLocaleString("en-IN")}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Pregnancy records
              </p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Pregnancy records
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Search and review registered pregnancy records
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-80">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) =>
                    handleSearchChange(event.target.value)
                  }
                  placeholder="Search pregnancy, patient, facility ID..."
                  aria-label="Search pregnancy records"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  handleStatusChange(event.target.value)
                }
                aria-label="Filter by pregnancy status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-500"
              >
                <option value="all">All statuses</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="loss">Loss</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          {isLoading && (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3">
              <Loader2
                size={28}
                className="animate-spin text-teal-700"
              />
              <p className="text-sm text-slate-500">
                Loading pregnancy records...
              </p>
            </div>
          )}

          {!isLoading && !error && filteredPregnancies.length === 0 && (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
              <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
                <HeartPulse size={28} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No pregnancy records found
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {searchInput || statusFilter !== "all"
                  ? "No records match your search or selected status. Try changing the filters."
                  : "There are currently no pregnancy records available."}
              </p>

              {(searchInput || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setStatusFilter("all");
                    setPage(1);
                  }}
                  className="mt-4 text-sm font-semibold text-teal-700 hover:text-teal-900"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {!isLoading && !error && paginatedPregnancies.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-4">Pregnancy</th>
                      <th className="px-5 py-4">Patient ID</th>
                      <th className="px-5 py-4">Last menstrual period</th>
                      <th className="px-5 py-4">Estimated due date</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedPregnancies.map((pregnancy) => (
                      <tr
                        key={pregnancy.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <p className="max-w-44 truncate text-sm font-semibold text-slate-900">
                            {pregnancy.id}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Created {formatDate(pregnancy.created_at)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-44 truncate text-sm text-slate-700">
                            {pregnancy.maternal_patient_id}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(pregnancy.last_menstrual_period)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(pregnancy.estimated_due_date)}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={pregnancy.pregnancy_status}
                          />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              void handleViewPregnancy(pregnancy.id)
                            }
                            disabled={isDetailsLoading}
                            aria-label={`View pregnancy ${pregnancy.id}`}
                            title="View pregnancy details"
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Eye size={15} />
                            View details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-800">
                    {firstRecord}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-800">
                    {lastRecord}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredPregnancies.length}
                  </span>{" "}
                  pregnancy records
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <span className="px-2 text-xs font-semibold tabular-nums text-slate-600">
                    {page} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.min(totalPages, current + 1),
                      )
                    }
                    disabled={page >= totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <footer className="pb-2 text-center text-xs text-slate-400">
          MatriCare AI · Pregnancy management
        </footer>
      </div>

      {selectedPregnancy && (
        <PregnancyDetailsModal
          pregnancy={selectedPregnancy}
          onClose={() => setSelectedPregnancy(null)}
        />
      )}
    </main>
  );
}

export default AdminPregnancies;
