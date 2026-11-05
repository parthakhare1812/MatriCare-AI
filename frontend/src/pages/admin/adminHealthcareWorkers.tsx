
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BriefcaseMedical,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { healthcareWorkerService } from "../../services/healthcareWorker.service";

import type {
  HealthcareWorkerProfile,
  HealthcareWorkerUser,
} from "../../types/healthcareWorker";

type StatusFilter = "all" | "active" | "inactive";

const PAGE_SIZE = 8;

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconStyle,
}: {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  iconStyle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className={`rounded-xl p-3 ${iconStyle}`}>
          <Icon size={21} />
        </div>
        <span className="text-xs font-medium text-slate-400">{title}</span>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function ProfileDetail({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={15} />
        <span className="text-xs">{label}</span>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value || "Not provided"}
      </p>
    </div>
  );
}

export default function AdminHealthcareWorkers() {
  const [workers, setWorkers] = useState<HealthcareWorkerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedWorker, setSelectedWorker] =
    useState<HealthcareWorkerUser | null>(null);

  const [selectedProfile, setSelectedProfile] =
    useState<HealthcareWorkerProfile | null>(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchWorkers() {
      try {
        const response = await healthcareWorkerService.getAdminWorkers();

        if (!cancelled) {
          setWorkers(
            response.filter(
              (worker) => worker.role === "healthcare_worker",
            ),
          );
          setError("");
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load healthcare workers. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchWorkers();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filteredWorkers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return workers.filter((worker) => {
      const matchesSearch =
        !normalizedSearch ||
        worker.full_name.toLowerCase().includes(normalizedSearch) ||
        worker.email.toLowerCase().includes(normalizedSearch) ||
        worker.id.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && worker.is_active) ||
        (statusFilter === "inactive" && !worker.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [workers, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredWorkers.length / PAGE_SIZE),
  );

  const paginatedWorkers = filteredWorkers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const activeCount = workers.filter((worker) => worker.is_active).length;
  const inactiveCount = workers.length - activeCount;
  const verifiedCount = workers.filter((worker) => worker.is_verified).length;

  function handleRefresh() {
    setLoading(true);
    setError("");
    setRefreshKey((previous) => previous + 1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleStatusFilter(value: StatusFilter) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  async function openWorkerProfile(worker: HealthcareWorkerUser) {
    setSelectedWorker(worker);
    setSelectedProfile(null);
    setProfileError("");
    setProfileLoading(true);

    try {
      const profile =
        await healthcareWorkerService.getAdminWorkerProfile(worker.id);

      setSelectedProfile(profile);
    } catch {
      setProfileError(
        "Unable to retrieve this worker's professional profile. It may not have been registered yet.",
      );
    } finally {
      setProfileLoading(false);
    }
  }

  function closeProfile() {
    setSelectedWorker(null);
    setSelectedProfile(null);
    setProfileError("");
    setProfileLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-teal-700">
            Administration / Workforce
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Healthcare Workers
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor registered healthcare worker accounts and professional
            profiles.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Workforce"
          value={workers.length}
          description="Registered worker accounts"
          icon={Users}
          iconStyle="bg-teal-50 text-teal-700"
        />

        <SummaryCard
          title="Availability"
          value={activeCount}
          description="Active worker accounts"
          icon={Activity}
          iconStyle="bg-emerald-50 text-emerald-700"
        />

        <SummaryCard
          title="Account status"
          value={inactiveCount}
          description="Inactive worker accounts"
          icon={AlertCircle}
          iconStyle="bg-amber-50 text-amber-700"
        />

        <SummaryCard
          title="Verification"
          value={verifiedCount}
          description="Verified user accounts"
          icon={ShieldCheck}
          iconStyle="bg-blue-50 text-blue-700"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Healthcare worker directory
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Search, filter, and review registered worker information.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => handleSearch(event.target.value)}
                placeholder="Search name, email or ID"
                aria-label="Search healthcare workers"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                handleStatusFilter(event.target.value as StatusFilter)
              }
              aria-label="Filter by account status"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3">
            <RefreshCw
              size={26}
              className="animate-spin text-teal-600"
            />

            <p className="text-sm font-medium text-slate-600">
              Loading healthcare workers...
            </p>

            <p className="text-xs text-slate-400">
              Retrieving the latest account information
            </p>
          </div>
        ) : error ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-full bg-rose-50 p-3 text-rose-600">
              <AlertCircle size={26} />
            </div>

            <p className="mt-3 font-semibold text-slate-800">
              Unable to load workforce data
            </p>

            <p className="mt-1 max-w-sm text-sm text-slate-500">{error}</p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-full bg-slate-100 p-4 text-slate-400">
              <Users size={30} />
            </div>

            <p className="mt-3 font-semibold text-slate-800">
              No healthcare workers found
            </p>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {workers.length === 0
                ? "No healthcare worker accounts are currently available."
                : "Try adjusting your search or selecting a different account status."}
            </p>

            {(search || statusFilter !== "all") && (
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
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Worker</th>
                    <th className="px-5 py-4">Email address</th>
                    <th className="px-5 py-4">Registered on</th>
                    <th className="px-5 py-4">Verification</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedWorkers.map((worker) => (
                    <tr
                      key={worker.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-800">
                            {getInitials(worker.full_name)}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {worker.full_name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              ID: {worker.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {worker.email}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(worker.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        {worker.is_verified ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 size={15} />
                            Verified
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-500">
                            Not verified
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge active={worker.is_active} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => void openWorkerProfile(worker)}
                          className="rounded-lg border border-teal-100 px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
                        >
                          View profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>
                {" - "}
                <span className="font-semibold text-slate-700">
                  {Math.min(
                    currentPage * PAGE_SIZE,
                    filteredWorkers.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredWorkers.length}
                </span>{" "}
                workers
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>

                <span className="min-w-24 text-center text-sm font-medium text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1),
                    )
                  }
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {selectedWorker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProfile();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="worker-profile-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  Workforce profile
                </p>

                <h2
                  id="worker-profile-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Worker details
                </h2>
              </div>

              <button
                type="button"
                onClick={closeProfile}
                aria-label="Close profile"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-800">
                  {getInitials(selectedWorker.full_name)}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-slate-900">
                    {selectedWorker.full_name}
                  </h3>

                  <p className="mt-1 break-all text-sm text-slate-500">
                    {selectedWorker.email}
                  </p>

                  <div className="mt-2">
                    <StatusBadge active={selectedWorker.is_active} />
                  </div>
                </div>
              </div>

              {profileLoading ? (
                <div className="flex min-h-40 flex-col items-center justify-center gap-3">
                  <RefreshCw
                    size={25}
                    className="animate-spin text-teal-600"
                  />

                  <p className="text-sm text-slate-500">
                    Loading professional profile...
                  </p>
                </div>
              ) : profileError ? (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertCircle
                      size={20}
                      className="shrink-0 text-amber-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        Profile unavailable
                      </p>

                      <p className="mt-1 text-sm text-amber-800">
                        {profileError}
                      </p>
                    </div>
                  </div>
                </div>
              ) : selectedProfile ? (
                <div className="mt-6 space-y-5">
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                      Professional information
                    </h3>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <ProfileDetail
                        label="Designation"
                        value={selectedProfile.designation}
                        icon={BriefcaseMedical}
                      />

                      <ProfileDetail
                        label="Employee ID"
                        value={selectedProfile.employee_id}
                        icon={ShieldCheck}
                      />

                      <ProfileDetail
                        label="Phone number"
                        value={selectedProfile.phone}
                        icon={Phone}
                      />

                      <ProfileDetail
                        label="Registration number"
                        value={
                          selectedProfile.professional_registration_number ??
                          "Not provided"
                        }
                        icon={ShieldCheck}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                      Account information
                    </h3>

                    <div className="space-y-3 rounded-xl border border-slate-100 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex items-center gap-2 text-sm text-slate-500">
                          <Mail size={15} />
                          Email address
                        </span>

                        <span className="break-all text-right text-sm font-medium text-slate-800">
                          {selectedWorker.email}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-500">
                          Email verification
                        </span>

                        <span className="text-sm font-medium text-slate-800">
                          {selectedWorker.is_verified
                            ? "Verified"
                            : "Not verified"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-500">
                          Account created
                        </span>

                        <span className="text-sm font-medium text-slate-800">
                          {formatDate(selectedWorker.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-500">
                          Profile created
                        </span>

                        <span className="text-sm font-medium text-slate-800">
                          {formatDate(selectedProfile.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end border-t border-slate-100 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={closeProfile}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
