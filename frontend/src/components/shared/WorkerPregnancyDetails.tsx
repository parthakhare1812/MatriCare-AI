import {
  CalendarDays,
  Clock,
  UserRound,
  X,
} from "lucide-react";

import type { Pregnancy } from "../../types/pregnancy";

interface WorkerPregnancyDetailsProps {
  pregnancy: Pregnancy;
  onClose: () => void;
  onEdit: () => void;
}

function formatDate(value: string | null): string {
  if (!value) return "Not recorded";

  const parts = value.split("T")[0].split("-");

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
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusStyle(status: Pregnancy["pregnancy_status"]): string {
  switch (status) {
    case "ongoing":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "completed":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "loss":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-2 break-all text-sm font-semibold text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

function WorkerPregnancyDetails({
  pregnancy,
  onClose,
  onEdit,
}: WorkerPregnancyDetailsProps) {
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
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
              <CalendarDays size={15} />
              Pregnancy management
            </div>

            <h2
              id="pregnancy-details-title"
              className="text-xl font-bold text-slate-900"
            >
              Pregnancy Details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Complete pregnancy record information
            </p>
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <CalendarDays size={24} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Pregnancy Record
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  ID: {pregnancy.id}
                </p>
              </div>
            </div>

            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(
                pregnancy.pregnancy_status,
              )}`}
            >
              {pregnancy.pregnancy_status.replace("_", " ")}
            </span>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <CalendarDays size={17} className="text-teal-700" />
              Pregnancy Information
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem
                label="Last Menstrual Period"
                value={formatDate(pregnancy.last_menstrual_period)}
              />

              <DetailItem
                label="Estimated Due Date"
                value={formatDate(pregnancy.estimated_due_date)}
              />

              <DetailItem
                label="Pregnancy Status"
                value={pregnancy.pregnancy_status.replace("_", " ")}
              />

              <DetailItem
                label="Registered On"
                value={formatDateTime(pregnancy.created_at)}
              />

              <DetailItem
                label="Last Updated"
                value={formatDateTime(pregnancy.updated_at)}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <UserRound size={17} className="text-teal-700" />
              Associated Records
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem
                label="Maternal Patient ID"
                value={pregnancy.maternal_patient_id}
              />

              <DetailItem
                label="Registered By Worker ID"
                value={pregnancy.registered_by_worker_id}
              />

              <DetailItem
                label="Facility ID"
                value={pregnancy.facility_id}
              />
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Clock size={18} className="mt-0.5 shrink-0 text-blue-700" />

              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Record Information
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-800">
                  This information is retrieved from the pregnancy record
                  stored by the MatriCare AI backend. Fields that were not
                  recorded are displayed as unavailable.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Edit Pregnancy
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

export default WorkerPregnancyDetails;