import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import {
  AlertCircle,
  CalendarDays,
  Loader2,
  Save,
  UserRound,
  X,
} from "lucide-react";

import { patientService } from "../../services/patient.service";
import { pregnancyService } from "../../services/pregnancy.service";

import type { MaternalPatient } from "../../types/patient";
import type { Pregnancy } from "../../types/pregnancy";

interface WorkerPregnancyFormProps {
  onSuccess: (pregnancy: Pregnancy) => void;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (!error.response) {
      return "Unable to connect to the server. Please check your backend.";
    }

    return error.message || "The request could not be completed.";
  }

  return "Something went wrong. Please try again.";
}

function WorkerPregnancyForm({
  onSuccess,
  onCancel,
}: WorkerPregnancyFormProps) {
  const [patients, setPatients] = useState<MaternalPatient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [lastMenstrualPeriod, setLastMenstrualPeriod] = useState("");
  const [estimatedDueDate, setEstimatedDueDate] = useState("");

  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [patientError, setPatientError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadPatients = async () => {
      try {
        const result = await patientService.getPatients({
          page: 1,
          page_size: 100,
        });

        if (!cancelled) {
          setPatients(result.patients.filter((patient) => patient.is_active));
        }
      } catch (requestError) {
        if (!cancelled) {
          setPatientError(getErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPatients(false);
        }
      }
    };

    const startLoading = async () => {
      await Promise.resolve();

      if (!cancelled) {
        await loadPatients();
      }
    };

    void startLoading();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!patientId) {
      setError("Please select a patient.");
      return;
    }

    if (
      lastMenstrualPeriod &&
      estimatedDueDate &&
      estimatedDueDate < lastMenstrualPeriod
    ) {
      setError(
        "Estimated due date cannot be earlier than the last menstrual period.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const pregnancy = await pregnancyService.registerPregnancy({
        maternal_patient_id: patientId,
        last_menstrual_period: lastMenstrualPeriod || null,
        estimated_due_date: estimatedDueDate || null,
      });

      onSuccess(pregnancy);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
            <CalendarDays size={15} />
            Pregnancy management
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            Register Pregnancy
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create a pregnancy record for an existing patient.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Close pregnancy registration"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="pregnancy-patient"
            className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
          >
            <UserRound size={16} className="text-teal-700" />
            Select Patient *
          </label>

          <select
            id="pregnancy-patient"
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            disabled={isLoadingPatients || isSubmitting}
            required
            className={inputClass}
          >
            <option value="">
              {isLoadingPatients
                ? "Loading patients..."
                : "Select an existing patient"}
            </option>

            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.full_name} — {patient.phone}
              </option>
            ))}
          </select>

          {isLoadingPatients && (
            <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <Loader2 size={13} className="animate-spin" />
              Loading active patient records...
            </p>
          )}

          {!isLoadingPatients && patientError && (
            <p className="mt-2 text-xs text-red-600">{patientError}</p>
          )}

          {!isLoadingPatients &&
            !patientError &&
            patients.length === 0 && (
              <p className="mt-2 text-xs text-amber-700">
                No active patients are available. Register a patient before
                creating a pregnancy record.
              </p>
            )}

          {!isLoadingPatients && patients.length > 0 && (
            <p className="mt-2 text-xs text-slate-400">
              Select an active patient from your assigned facilities.
            </p>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="pregnancy-lmp"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Last Menstrual Period (LMP)
            </label>

            <input
              id="pregnancy-lmp"
              type="date"
              value={lastMenstrualPeriod}
              onChange={(event) =>
                setLastMenstrualPeriod(event.target.value)
              }
              disabled={isSubmitting}
              className={inputClass}
            />

            <p className="mt-2 text-xs text-slate-400">
              Optional. Enter the first day of the last menstrual period.
            </p>
          </div>

          <div>
            <label
              htmlFor="pregnancy-edd"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Estimated Due Date (EDD)
            </label>

            <input
              id="pregnancy-edd"
              type="date"
              value={estimatedDueDate}
              onChange={(event) => setEstimatedDueDate(event.target.value)}
              disabled={isSubmitting}
              min={lastMenstrualPeriod || undefined}
              className={inputClass}
            />

            <p className="mt-2 text-xs text-slate-400">
              Optional. Must not be earlier than the LMP.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
          <div className="flex items-start gap-3">
            <CalendarDays
              size={19}
              className="mt-0.5 shrink-0 text-teal-700"
            />

            <div>
              <p className="text-sm font-semibold text-teal-900">
                Pregnancy record information
              </p>

              <p className="mt-1 text-xs leading-5 text-teal-800">
                Pregnancy status, facility assignment, and registering
                healthcare worker are managed by the backend. New pregnancy
                records receive their status from the backend.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              isLoadingPatients ||
              patients.length === 0 ||
              !patientId
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}

            {isSubmitting ? "Registering..." : "Register Pregnancy"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default WorkerPregnancyForm;