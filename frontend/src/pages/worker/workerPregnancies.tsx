import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { patientService } from "../../services/patient.service";
import { pregnancyService } from "../../services/pregnancy.service";
import WorkerPregnancyForm from "../../components/forms/WorkerPregnancyForm";
import WorkerPregnancyEditForm from "../../components/forms/WorkerPregnancyEditForm";
import WorkerPregnancyDetails from "../../components/shared/WorkerPregnancyDetails";

import type { MaternalPatient } from "../../types/patient";
import type {
  Pregnancy,
  PregnancyStatus,
} from "../../types/pregnancy";

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

function formatDate(value: string | null): string {
  if (!value) return "Not recorded";

  const datePart = value.split("T")[0];
  const parts = datePart.split("-");

  if (parts.length !== 3) return "Not recorded";

  const [year, month, day] = parts.map(Number);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "Not recorded";
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

function getStatusStyle(status: PregnancyStatus): string {
  switch (status) {
    case "ongoing":
      return "bg-emerald-50 text-emerald-700";

    case "completed":
      return "bg-blue-50 text-blue-700";

    case "loss":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function PregnancyCard({
  pregnancy,
  onViewDetails,
}: {
  pregnancy: Pregnancy;
  onViewDetails: (pregnancy: Pregnancy) => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-teal-100 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <CalendarDays size={22} />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              Pregnancy Record
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              ID: {pregnancy.id}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
            pregnancy.pregnancy_status,
          )}`}
        >
          {pregnancy.pregnancy_status.replace("_", " ")}
        </span>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Last Menstrual Period
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            {formatDate(pregnancy.last_menstrual_period)}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">
            Estimated Due Date
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            {formatDate(pregnancy.estimated_due_date)}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">
            Registered On
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            {formatDateTime(pregnancy.created_at)}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">
            Last Updated
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            {formatDateTime(pregnancy.updated_at)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="break-all text-xs text-slate-400">
          Facility ID: {pregnancy.facility_id}
        </p>

        <button
          type="button"
          onClick={() => onViewDetails(pregnancy)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
        >
          <Eye size={15} />
          View Details
        </button>
      </div>
    </article>
  );
}

function WorkerPregnancies() {
  const [patients, setPatients] = useState<MaternalPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);

  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isLoadingPregnancies, setIsLoadingPregnancies] = useState(false);

  const [patientsError, setPatientsError] = useState("");
  const [pregnanciesError, setPregnanciesError] = useState("");
  const [actionError, setActionError] = useState("");

  const [showRegistration, setShowRegistration] = useState(false);

  const [selectedPregnancy, setSelectedPregnancy] =
    useState<Pregnancy | null>(null);

  const [showEditForm, setShowEditForm] = useState(false);
  const [isRefreshingDetails, setIsRefreshingDetails] = useState(false);

  const loadPatients = useCallback(async () => {
    setIsLoadingPatients(true);
    setPatientsError("");

    try {
      const result = await patientService.getPatients({
        page: 1,
        page_size: 100,
      });

      const activePatients = result.patients.filter(
        (patient) => patient.is_active,
      );

      setPatients(activePatients);
    } catch (error) {
      setPatientsError(getErrorMessage(error));
    } finally {
      setIsLoadingPatients(false);
    }
  }, []);

  const loadPregnancies = useCallback(async () => {
    if (!selectedPatientId) {
      setPregnancies([]);
      return;
    }

    setIsLoadingPregnancies(true);
    setPregnanciesError("");

    try {
      const result = await pregnancyService.getPatientPregnancies(
        selectedPatientId,
      );

      setPregnancies(result);
    } catch (error) {
      setPregnancies([]);
      setPregnanciesError(getErrorMessage(error));
    } finally {
      setIsLoadingPregnancies(false);
    }
  }, [selectedPatientId]);

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

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      await Promise.resolve();

      if (!cancelled) {
        await loadPregnancies();
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [loadPregnancies]);

  const handlePatientChange = (patientId: string) => {
    setSelectedPatientId(patientId);
    setShowRegistration(false);
    setSelectedPregnancy(null);
    setShowEditForm(false);
    setPregnancies([]);
    setPregnanciesError("");
    setActionError("");
  };

  const handleRegistrationSuccess = () => {
    setShowRegistration(false);
    void loadPregnancies();
  };

  const handleViewDetails = (pregnancy: Pregnancy) => {
    setSelectedPregnancy(pregnancy);
    setShowEditForm(false);
    setActionError("");
  };

  const handleEditSuccess = async () => {
    if (!selectedPregnancy) return;

    setIsRefreshingDetails(true);
    setActionError("");

    try {
      const updatedPregnancy = await pregnancyService.getPregnancy(
        selectedPregnancy.id,
      );

      setSelectedPregnancy(updatedPregnancy);

      setPregnancies((current) =>
        current.map((pregnancy) =>
          pregnancy.id === updatedPregnancy.id
            ? updatedPregnancy
            : pregnancy,
        ),
      );

      setShowEditForm(false);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsRefreshingDetails(false);
    }

    await loadPregnancies();
  };

  const handleCloseDetails = () => {
    setSelectedPregnancy(null);
    setShowEditForm(false);
    setActionError("");
  };

  const selectedPatient = patients.find(
    (patient) => patient.id === selectedPatientId,
  );

  return (
    <main className="min-h-full bg-[#f5f8f8]">
      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
              <CalendarDays size={15} />
              Healthcare worker workspace
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Pregnancy Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              View and manage pregnancy records associated with patients
              registered through your assigned facilities.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadPatients()}
              disabled={isLoadingPatients}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isLoadingPatients ? "animate-spin" : ""}
              />
              Refresh Patients
            </button>

            <button
              type="button"
              onClick={() => setShowRegistration((current) => !current)}
              disabled={!selectedPatientId}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {showRegistration ? <X size={16} /> : <Plus size={17} />}
              {showRegistration ? "Close Form" : "Register Pregnancy"}
            </button>
          </div>
        </header>

        {actionError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <UserRound size={19} className="text-teal-700" />

            <h2 className="font-bold text-slate-900">
              Select Patient
            </h2>
          </div>

          {patientsError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{patientsError}</span>
            </div>
          )}

          <div className="relative">
            <select
              value={selectedPatientId}
              onChange={(event) =>
                handlePatientChange(event.target.value)
              }
              disabled={isLoadingPatients}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 disabled:opacity-60"
            >
              <option value="">
                {isLoadingPatients
                  ? "Loading patients..."
                  : "Select a patient to view pregnancy records"}
              </option>

              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name} — {patient.phone}
                </option>
              ))}
            </select>

            <ChevronDown
              size={17}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {isLoadingPatients && (
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Loader2 size={14} className="animate-spin" />
              Loading active patient records...
            </p>
          )}

          {!isLoadingPatients &&
            !patientsError &&
            patients.length === 0 && (
              <p className="mt-3 text-sm text-amber-700">
                No active patients are available. Register a patient first.
              </p>
            )}

          {selectedPatient && (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-teal-100 bg-teal-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-700">
                <UserRound size={20} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-teal-900">
                  {selectedPatient.full_name}
                </p>

                <p className="mt-1 text-xs text-teal-700">
                  {selectedPatient.phone} · {selectedPatient.district},{" "}
                  {selectedPatient.state}
                </p>
              </div>
            </div>
          )}
        </section>

        {showRegistration && selectedPatientId && (
          <WorkerPregnancyForm
            onCancel={() => setShowRegistration(false)}
            onSuccess={handleRegistrationSuccess}
          />
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pregnancy records
                </p>

                <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                  {selectedPatientId && !isLoadingPregnancies
                    ? pregnancies.length
                    : "—"}
                </p>
              </div>

              <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
                <ClipboardList size={23} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Records for the selected patient
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Ongoing pregnancies
                </p>

                <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                  {selectedPatientId && !isLoadingPregnancies
                    ? pregnancies.filter(
                        (pregnancy) =>
                          pregnancy.pregnancy_status === "ongoing",
                      ).length
                    : "—"}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                <CalendarDays size={23} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Based on the selected patient's records
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Pregnancy Records
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Pregnancy history for the selected patient
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadPregnancies()}
              disabled={!selectedPatientId || isLoadingPregnancies}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={isLoadingPregnancies ? "animate-spin" : ""}
              />
              Refresh Records
            </button>
          </div>

          {!selectedPatientId && (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
              <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
                <Users size={28} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                Select a patient
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Choose an existing patient above to retrieve their pregnancy
                records.
              </p>
            </div>
          )}

          {selectedPatientId && isLoadingPregnancies && (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3">
              <Loader2 size={28} className="animate-spin text-teal-700" />

              <p className="text-sm text-slate-500">
                Loading pregnancy records...
              </p>
            </div>
          )}

          {selectedPatientId &&
            !isLoadingPregnancies &&
            pregnanciesError && (
              <div className="m-5 flex flex-col items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-8 text-center">
                <AlertCircle size={25} className="text-red-600" />

                <p className="max-w-xl text-sm text-red-700">
                  {pregnanciesError}
                </p>

                <button
                  type="button"
                  onClick={() => void loadPregnancies()}
                  className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
                >
                  Try again
                </button>
              </div>
            )}

          {selectedPatientId &&
            !isLoadingPregnancies &&
            !pregnanciesError &&
            pregnancies.length === 0 && (
              <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
                  <CalendarDays size={28} />
                </div>

                <h3 className="mt-4 font-semibold text-slate-800">
                  No pregnancy records found
                </h3>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  No pregnancy records are available for this patient.
                  You can register a new pregnancy record.
                </p>

                <button
                  type="button"
                  onClick={() => setShowRegistration(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  <Plus size={16} />
                  Register Pregnancy
                </button>
              </div>
            )}

          {selectedPatientId &&
            !isLoadingPregnancies &&
            !pregnanciesError &&
            pregnancies.length > 0 && (
              <div className="grid gap-4 p-5 lg:grid-cols-2">
                {pregnancies.map((pregnancy) => (
                  <PregnancyCard
                    key={pregnancy.id}
                    pregnancy={pregnancy}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
        </section>
      </div>

      {selectedPregnancy && !showEditForm && (
        <WorkerPregnancyDetails
          pregnancy={selectedPregnancy}
          onClose={handleCloseDetails}
          onEdit={() => setShowEditForm(true)}
        />
      )}

      {selectedPregnancy && showEditForm && (
        <WorkerPregnancyEditForm
          pregnancy={selectedPregnancy}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditForm(false)}
        />
      )}

      {isRefreshingDetails && (
        <div className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg">
          <Loader2 size={16} className="animate-spin text-teal-700" />
          Refreshing pregnancy record...
        </div>
      )}
    </main>
  );
}

export default WorkerPregnancies;