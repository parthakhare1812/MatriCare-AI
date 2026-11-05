
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import axios from "axios";

import { patientService } from "../../services/patient.service";
import type {
  MaternalPatient,
  MaternalPatientListResponse,
} from "../../types/patient";

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (!error.response) {
      return "Unable to connect to the server. Check that the backend is running.";
    }

    return error.message || "The request could not be completed.";
  }

  return "Something went wrong. Please try again.";
}

function formatDate(value: string): string {
  if (!value) {
    return "—";
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
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

function PatientDetailsModal({
  patient,
  onClose,
}: {
  patient: MaternalPatient;
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
        aria-labelledby="patient-details-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Patient record
            </p>
            <h2
              id="patient-details-title"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              Patient details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close patient details"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <UserRound size={27} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-slate-900">
                {patient.full_name}
              </h3>
              <p className="mt-1 break-all text-xs text-slate-500">
                ID: {patient.id}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                patient.is_active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {patient.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Date of birth" value={formatDate(patient.date_of_birth)} />
            <DetailItem label="Phone number" value={patient.phone} />
            <DetailItem label="District" value={patient.district} />
            <DetailItem label="State" value={patient.state} />
            <DetailItem label="Facility ID" value={patient.facility_id} />
            <DetailItem
              label="Registered by worker ID"
              value={patient.registered_by_worker_id}
            />
            <DetailItem
              label="Registered on"
              value={formatDateTime(patient.created_at)}
            />
            <DetailItem
              label="Last updated"
              value={formatDateTime(patient.updated_at)}
            />
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Address
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-800">
              {patient.address}
            </p>
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

interface PatientManagementContentProps {
  appliedSearch: string;
}

function PatientManagementContent({
  appliedSearch,
}: PatientManagementContentProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState<MaternalPatientListResponse | null>(null);
  const [searchInput, setSearchInput] = useState(appliedSearch);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [selectedPatient, setSelectedPatient] =
    useState<MaternalPatient | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const loadPatients = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await patientService.getAdminPatients({
        search: appliedSearch || undefined,
        page,
        page_size: PAGE_SIZE,
      });

      setData(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [appliedSearch, page]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      await Promise.resolve();

      if (!cancelled) {
        await loadPatients();
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [loadPatients]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedSearch = searchInput.trim();

    if (normalizedSearch.length === 1) {
      setSearchError("Enter at least 2 characters to search.");
      return;
    }

    setSearchError("");

    const nextParams = new URLSearchParams(searchParams);

    if (normalizedSearch) {
      nextParams.set("search", normalizedSearch);
    } else {
      nextParams.delete("search");
    }

    setSearchParams(nextParams);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchError("");

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("search");

    setSearchParams(nextParams);
  };

  const handleViewPatient = async (patientId: string) => {
    setIsDetailsLoading(true);
    setActionError("");

    try {
      const patient = await patientService.getAdminPatient(patientId);
      setSelectedPatient(patient);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleDeactivate = async (patient: MaternalPatient) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${patient.full_name}? This changes the patient's active status.`,
    );

    if (!confirmed) {
      return;
    }

    setDeactivatingId(patient.id);
    setActionError("");

    try {
      await patientService.deactivateAdminPatient(patient.id);

      if (selectedPatient?.id === patient.id) {
        setSelectedPatient(null);
      }

      await loadPatients();
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setDeactivatingId(null);
    }
  };

  const patients = data?.patients ?? [];
  const totalPages = data?.total_pages ?? 0;

  const firstRecord =
    data && data.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;

  const lastRecord = (page - 1) * PAGE_SIZE + patients.length;

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
              Patient Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              View and manage maternal patient records across registered
              facilities.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadPatients()}
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

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total matching patients
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                  {data ? data.total.toLocaleString("en-IN") : "—"}
                </p>
              </div>

              <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
                <Users size={23} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Based on the current search
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Records on this page
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                  {data ? patients.length : "—"}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
                <UserRound size={23} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Showing up to {PAGE_SIZE} records per page
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Registered patients
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Search and review patient registration records
              </p>
            </div>

            <form
              onSubmit={handleSearch}
              className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
            >
              <div className="relative min-w-0 flex-1 sm:w-72">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    setSearchError("");
                  }}
                  placeholder="Search name or phone..."
                  aria-label="Search patients by name or phone"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                Search
              </button>

              {(appliedSearch || searchInput) && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          {searchError && (
            <p
              role="alert"
              className="mx-5 mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
            >
              {searchError}
            </p>
          )}

          {actionError && (
            <div
              role="alert"
              className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{actionError}</span>

              <button
                type="button"
                onClick={() => setActionError("")}
                aria-label="Dismiss error"
                className="ml-auto"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {error && (
            <div className="m-5 flex flex-col items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-8 text-center">
              <AlertCircle size={25} className="text-red-600" />
              <p className="max-w-xl text-sm text-red-700">{error}</p>

              <button
                type="button"
                onClick={() => void loadPatients()}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
              >
                Try again
              </button>
            </div>
          )}

          {!error && isLoading && (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3">
              <Loader2
                size={28}
                className="animate-spin text-teal-700"
              />
              <p className="text-sm text-slate-500">
                Loading patient records...
              </p>
            </div>
          )}

          {!error && !isLoading && patients.length === 0 && (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
              <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
                <Users size={28} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No patient records found
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {appliedSearch
                  ? `No patients matched "${appliedSearch}". Try another name or phone number.`
                  : "There are currently no patient records available."}
              </p>

              {appliedSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="mt-4 text-sm font-semibold text-teal-700 hover:text-teal-900"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {!error && !isLoading && patients.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-4">Patient</th>
                      <th className="px-5 py-4">Contact</th>
                      <th className="px-5 py-4">Location</th>
                      <th className="px-5 py-4">Registered</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {patients.map((patient) => (
                      <tr
                        key={patient.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-sm font-bold text-teal-800">
                              {patient.full_name
                                .split(" ")
                                .slice(0, 2)
                                .map((part) => part[0])
                                .join("")
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-48 truncate text-sm font-semibold text-slate-900">
                                {patient.full_name}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                DOB: {formatDate(patient.date_of_birth)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Phone size={14} className="text-slate-400" />
                            {patient.phone}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <MapPin
                              size={14}
                              className="shrink-0 text-slate-400"
                            />
                            <span className="max-w-40 truncate">
                              {patient.district}, {patient.state}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(patient.created_at)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              patient.is_active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {patient.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void handleViewPatient(patient.id)
                              }
                              disabled={isDetailsLoading}
                              title="View patient details"
                              aria-label={`View ${patient.full_name}`}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50"
                            >
                              <Eye size={16} />
                            </button>

                            {patient.is_active && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleDeactivate(patient)
                                }
                                disabled={deactivatingId === patient.id}
                                className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deactivatingId === patient.id
                                  ? "Working..."
                                  : "Deactivate"}
                              </button>
                            )}
                          </div>
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
                    {data?.total ?? 0}
                  </span>{" "}
                  patients
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    disabled={page <= 1 || isLoading}
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
                    disabled={page >= totalPages || isLoading}
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
      </div>

      {selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </main>
  );
}

function AdminPatients() {
  const [searchParams] = useSearchParams();
  const appliedSearch = searchParams.get("search")?.trim() ?? "";

  return (
    <PatientManagementContent
      key={appliedSearch}
      appliedSearch={appliedSearch}
    />
  );
}

export default AdminPatients;
