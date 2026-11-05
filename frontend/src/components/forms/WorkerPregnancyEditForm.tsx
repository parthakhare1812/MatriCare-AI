import { useState, type FormEvent } from "react";
import axios from "axios";
import {
  AlertCircle,
  CalendarDays,
  Loader2,
  Save,
  X,
} from "lucide-react";

import { pregnancyService } from "../../services/pregnancy.service";

import type {
  Pregnancy,
  PregnancyStatus,
} from "../../types/pregnancy";

interface WorkerPregnancyEditFormProps {
  pregnancy: Pregnancy;
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
      return "Unable to connect to the server. Check that the backend is running.";
    }

    return error.message || "The request could not be completed.";
  }

  return "Something went wrong. Please try again.";
}

function WorkerPregnancyEditForm({
  pregnancy,
  onSuccess,
  onCancel,
}: WorkerPregnancyEditFormProps) {
  const [lastMenstrualPeriod, setLastMenstrualPeriod] = useState(
    pregnancy.last_menstrual_period ?? "",
  );

  const [estimatedDueDate, setEstimatedDueDate] = useState(
    pregnancy.estimated_due_date ?? "",
  );

  const [pregnancyStatus, setPregnancyStatus] =
    useState<PregnancyStatus>(pregnancy.pregnancy_status);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

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

    const hasChanges =
      lastMenstrualPeriod !== (pregnancy.last_menstrual_period ?? "") ||
      estimatedDueDate !== (pregnancy.estimated_due_date ?? "") ||
      pregnancyStatus !== pregnancy.pregnancy_status;

    if (!hasChanges) {
      setError("Please change at least one field before saving.");
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedPregnancy = await pregnancyService.updatePregnancy(
        pregnancy.id,
        {
          last_menstrual_period: lastMenstrualPeriod || null,
          estimated_due_date: estimatedDueDate || null,
          pregnancy_status: pregnancyStatus,
        },
      );

      onSuccess(updatedPregnancy);
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
            Edit Pregnancy
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update pregnancy dates and status.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Close pregnancy edit form"
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

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="edit-pregnancy-lmp"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Last Menstrual Period
            </label>

            <input
              id="edit-pregnancy-lmp"
              type="date"
              value={lastMenstrualPeriod}
              onChange={(event) =>
                setLastMenstrualPeriod(event.target.value)
              }
              disabled={isSubmitting}
              max={estimatedDueDate || undefined}
              className={inputClass}
            />

            <p className="mt-2 text-xs text-slate-400">
              The first day of the last menstrual period.
            </p>
          </div>

          <div>
            <label
              htmlFor="edit-pregnancy-edd"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Estimated Due Date
            </label>

            <input
              id="edit-pregnancy-edd"
              type="date"
              value={estimatedDueDate}
              onChange={(event) =>
                setEstimatedDueDate(event.target.value)
              }
              disabled={isSubmitting}
              min={lastMenstrualPeriod || undefined}
              className={inputClass}
            />

            <p className="mt-2 text-xs text-slate-400">
              Must not be earlier than the LMP.
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="edit-pregnancy-status"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Pregnancy Status
          </label>

          <select
            id="edit-pregnancy-status"
            value={pregnancyStatus}
            onChange={(event) =>
              setPregnancyStatus(event.target.value as PregnancyStatus)
            }
            disabled={isSubmitting}
            className={inputClass}
          >
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="loss">Loss</option>
            <option value="unknown">Unknown</option>
          </select>

          <p className="mt-2 text-xs text-slate-400">
            Select the appropriate status based on the verified clinical
            record.
          </p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            Clinical record accuracy
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-800">
            Update pregnancy information only using verified clinical
            information. Changing a pregnancy status should reflect the
            documented clinical outcome.
          </p>
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
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}

            {isSubmitting ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default WorkerPregnancyEditForm;