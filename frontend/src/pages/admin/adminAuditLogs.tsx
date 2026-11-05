
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import { auditLogService } from "../../services/auditLog.service";
import type {
  AuditLog,
  AuditLogListResponse,
} from "../../types/auditLog";

const PAGE_SIZE = 10;

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AuditLogDetailsModal({
  log,
  onClose,
}: {
  log: AuditLog;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-detail-title"
        className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2
                id="audit-detail-title"
                className="text-lg font-bold text-slate-900"
              >
                Audit event details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                System activity record
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close audit details"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Description
            </p>
            <p className="mt-1 text-sm leading-7 text-slate-800">
              {log.description}
            </p>
          </div>

          <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-400">Audit log ID</p>
              <p className="mt-1 break-all text-xs font-medium text-slate-700">
                {log.id}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">User ID</p>
              <p className="mt-1 break-all text-xs font-medium text-slate-700">
                {log.user_id ?? "System / unavailable"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Action</p>
              <p className="mt-1 break-words text-xs font-medium text-slate-700">
                {log.action}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Entity type</p>
              <p className="mt-1 text-xs font-medium text-slate-700">
                {log.entity_type}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Entity ID</p>
              <p className="mt-1 break-all text-xs font-medium text-slate-700">
                {log.entity_id ?? "Not available"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">IP address</p>
              <p className="mt-1 text-xs font-medium text-slate-700">
                {log.ip_address ?? "Not recorded"}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs text-slate-400">Timestamp</p>
              <p className="mt-1 text-xs font-medium text-slate-700">
                {formatDate(log.created_at)}
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

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(async () => {
      try {
        const response: AuditLogListResponse =
          await auditLogService.getSystemAuditLogs(page, PAGE_SIZE);

        if (cancelled) return;

        setLogs(response.logs);
        setTotal(response.total);
        setError("");
      } catch {
        if (cancelled) return;

        setError("Unable to load audit logs. Please try again.");
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

  const actionOptions = useMemo(
    () => [...new Set(logs.map((log) => log.action))].sort(),
    [logs],
  );

  const entityOptions = useMemo(
    () => [...new Set(logs.map((log) => log.entity_type))].sort(),
    [logs],
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const term = search.trim().toLowerCase();

      const matchesSearch =
        !term ||
        log.description.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.entity_type.toLowerCase().includes(term) ||
        (log.entity_id ?? "").toLowerCase().includes(term) ||
        (log.user_id ?? "").toLowerCase().includes(term) ||
        log.id.toLowerCase().includes(term);

      const matchesAction =
        actionFilter === "all" || log.action === actionFilter;

      const matchesEntity =
        entityFilter === "all" || log.entity_type === entityFilter;

      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [logs, search, actionFilter, entityFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleRefresh = () => {
    setLoading(true);
    setError("");
    setRefreshKey((current) => current + 1);
  };

  const handleViewDetails = async (log: AuditLog) => {
    setSelectedLog(log);
    setDetailLoading(true);
    setDetailError("");

    try {
      const details = await auditLogService.getAuditLogDetails(log.id);
      setSelectedLog(details);
    } catch {
      setDetailError(
        "Unable to retrieve the latest event details. Showing the available list information.",
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
            <span className="text-teal-700">Audit Logs</span>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Audit Logs
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Review recorded system activities and maintain operational visibility.
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
                Total audit events
              </p>
              <Activity size={20} className="text-teal-700" />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
              {total}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Across all pages
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Events on this page
              </p>
              <FileText size={20} className="text-blue-700" />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
              {logs.length}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Current page
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Unique entity types
              </p>
              <UserRound size={20} className="text-violet-700" />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
              {entityOptions.length}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              On the current page
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
                  placeholder="Search description, action, user ID or entity ID..."
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <select
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-600"
              >
                <option value="all">All actions</option>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>

              <select
                value={entityFilter}
                onChange={(event) => setEntityFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-600"
              >
                <option value="all">All entity types</option>
                {entityOptions.map((entity) => (
                  <option key={entity} value={entity}>
                    {entity}
                  </option>
                ))}
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
                Loading audit history...
              </p>
            </div>
          ) : error ? null : filteredLogs.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <FileText size={26} className="text-slate-400" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-800">
                No audit events found
              </h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {logs.length === 0
                  ? "There are currently no audit records available."
                  : "Try changing your search term or filters."}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-start"
                  >
                    <div className="h-fit rounded-xl bg-teal-50 p-3 text-teal-700">
                      <ShieldCheck size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {log.action}
                        </h3>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {log.entity_type}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {log.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={13} />
                          {formatDate(log.created_at)}
                        </span>

                        <span>
                          User:{" "}
                          {log.user_id
                            ? `${log.user_id.slice(0, 8)}...`
                            : "System"}
                        </span>

                        <span>
                          Entity ID:{" "}
                          {log.entity_id
                            ? `${log.entity_id.slice(0, 8)}...`
                            : "Unavailable"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleViewDetails(log)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                    >
                      <Eye size={16} />
                      View details
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-800">
                    {(page - 1) * PAGE_SIZE + 1}
                  </span>
                  {" "}to{" "}
                  <span className="font-semibold text-slate-800">
                    {Math.min(page * PAGE_SIZE, total)}
                  </span>
                  {" "}of{" "}
                  <span className="font-semibold text-slate-800">
                    {total}
                  </span>
                  {" "}audit events
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    aria-label="Previous page"
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                    aria-label="Next page"
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <ShieldCheck size={19} className="mt-0.5 shrink-0 text-blue-700" />
          <div>
            <h2 className="text-sm font-semibold text-blue-900">
              Audit history is read-only
            </h2>
            <p className="mt-1 text-sm leading-6 text-blue-800">
              This workspace provides visibility into recorded system events.
              Audit records cannot be edited or deleted from this interface.
            </p>
          </div>
        </div>
      </div>

      {selectedLog && (
        <AuditLogDetailsModal
          log={selectedLog}
          onClose={() => {
            setSelectedLog(null);
            setDetailError("");
          }}
        />
      )}

      {selectedLog && detailLoading && (
        <div className="fixed bottom-5 right-5 z-[60] rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          Refreshing audit event details...
        </div>
      )}

      {selectedLog && detailError && (
        <div className="fixed bottom-5 right-5 z-[60] max-w-sm rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-lg">
          {detailError}
        </div>
      )}
    </div>
  );
}
