
import {
  CalendarDays,
  ClipboardList,
  FileText,
  HeartPulse,
  Pencil,
  X,
} from "lucide-react";

import Badge from "../ui/Badge";
import Button from "../ui/Button";

import type {
  AntenatalVisit,
  FollowUpStatus,
} from "../../types/antenatalVisit";

interface WorkerAntenatalVisitDetailsProps {
  visit: AntenatalVisit;
  onClose: () => void;
  onEdit: () => void;
}

function formatDate(value: string | null): string {
  if (!value) return "Not scheduled";

  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusVariant(
  status: FollowUpStatus
): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "completed":
      return "success";
    case "pending":
      return "warning";
    case "missed":
      return "danger";
    case "cancelled":
      return "neutral";
    default:
      return "neutral";
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
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}

function WorkerAntenatalVisitDetails({
  visit,
  onClose,
  onEdit,
}: WorkerAntenatalVisitDetailsProps) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="antenatal-visit-details-title"
        className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <HeartPulse size={22} />
            </div>

            <div>
              <h2
                id="antenatal-visit-details-title"
                className="text-lg font-bold text-slate-900"
              >
                Antenatal Visit Details
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Complete visit record information
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close visit details"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Visit Type
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900">
                {visit.visit_type}
              </h3>
            </div>

            <Badge variant={getStatusVariant(visit.follow_up_status)}>
              {visit.follow_up_status}
            </Badge>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays size={17} className="text-brand-600" />
              <h3 className="text-sm font-semibold text-slate-800">
                Visit Schedule
              </h3>
            </div>

            <div className="grid gap-5 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
              <DetailItem
                label="Visit Date"
                value={formatDate(visit.visit_date)}
              />

              <DetailItem
                label="Next Follow-up Date"
                value={formatDate(visit.next_follow_up_date)}
              />
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <FileText size={17} className="text-brand-600" />
              <h3 className="text-sm font-semibold text-slate-800">
                Clinical Notes
              </h3>
            </div>

            <div className="rounded-xl border border-slate-100 p-4">
              {visit.notes ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {visit.notes}
                </p>
              ) : (
                <p className="text-sm italic text-slate-400">
                  No clinical notes were recorded.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList size={17} className="text-brand-600" />
              <h3 className="text-sm font-semibold text-slate-800">
                Record Information
              </h3>
            </div>

            <div className="grid gap-5 rounded-xl border border-slate-100 p-4 sm:grid-cols-2">
              <DetailItem label="Visit ID" value={visit.id} />
              <DetailItem label="Pregnancy ID" value={visit.pregnancy_id} />
              <DetailItem label="Facility ID" value={visit.facility_id} />
              <DetailItem
                label="Recorded By Worker ID"
                value={visit.recorded_by_worker_id}
              />
              <DetailItem
                label="Created At"
                value={formatDateTime(visit.created_at)}
              />
              <DetailItem
                label="Last Updated"
                value={formatDateTime(visit.updated_at)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          <Button onClick={onEdit}>
            <Pencil size={16} className="mr-2" />
            Edit Visit
          </Button>
        </div>
      </div>
    </div>
  );
}

export default WorkerAntenatalVisitDetails;
