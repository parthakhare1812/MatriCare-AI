
import { useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, Loader2, Pencil } from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";

import { antenatalVisitService } from "../../services/antenatalVisit.service";

import type {
  AntenatalVisit,
  AntenatalVisitUpdate,
  FollowUpStatus,
} from "../../types/antenatalVisit";

interface WorkerAntenatalVisitEditFormProps {
  visit: AntenatalVisit;
  onSuccess: (visit: AntenatalVisit) => void;
  onCancel: () => void;
}

function WorkerAntenatalVisitEditForm({
  visit,
  onSuccess,
  onCancel,
}: WorkerAntenatalVisitEditFormProps) {
  const [visitDate, setVisitDate] = useState(visit.visit_date);
  const [visitType, setVisitType] = useState(visit.visit_type);
  const [notes, setNotes] = useState(visit.notes ?? "");
  const [nextFollowUpDate, setNextFollowUpDate] = useState(
    visit.next_follow_up_date ?? ""
  );
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus>(
    visit.follow_up_status
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (
      nextFollowUpDate &&
      visitDate &&
      nextFollowUpDate < visitDate
    ) {
      setError("Next follow-up date cannot be earlier than visit date.");
      return;
    }

    const updateData: AntenatalVisitUpdate = {};

    if (visitDate !== visit.visit_date) {
      updateData.visit_date = visitDate;
    }

    if (visitType.trim() !== visit.visit_type) {
      updateData.visit_type = visitType.trim();
    }

    if (notes !== (visit.notes ?? "")) {
      updateData.notes = notes.trim() || null;
    }

    if (nextFollowUpDate !== (visit.next_follow_up_date ?? "")) {
      updateData.next_follow_up_date = nextFollowUpDate || null;
    }

    if (followUpStatus !== visit.follow_up_status) {
      updateData.follow_up_status = followUpStatus;
    }

    if (Object.keys(updateData).length === 0) {
      setError("No changes detected. Please update at least one field.");
      return;
    }

    try {
      setSaving(true);

      const updatedVisit = await antenatalVisitService.updateVisit(
        visit.id,
        updateData
      );

      onSuccess(updatedVisit);
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof err.response === "object" &&
        err.response !== null &&
        "data" in err.response &&
        typeof err.response.data === "object" &&
        err.response.data !== null &&
        "detail" in err.response.data &&
        typeof err.response.data.detail === "string"
          ? err.response.data.detail
          : "Unable to update the antenatal visit. Please try again.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="lg">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Pencil size={20} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Edit Antenatal Visit
          </h2>
          <p className="text-sm text-slate-500">
            Update the visit record and follow-up status.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="edit-visit-date"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Visit Date *
            </label>

            <input
              id="edit-visit-date"
              type="date"
              value={visitDate}
              onChange={(event) => setVisitDate(event.target.value)}
              required
              disabled={saving}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label
              htmlFor="edit-visit-type"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Visit Type *
            </label>

            <input
              id="edit-visit-type"
              type="text"
              value={visitType}
              onChange={(event) => setVisitType(event.target.value)}
              minLength={2}
              maxLength={50}
              required
              disabled={saving}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="edit-follow-up-status"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Follow-up Status *
          </label>

          <select
            id="edit-follow-up-status"
            value={followUpStatus}
            onChange={(event) =>
              setFollowUpStatus(event.target.value as FollowUpStatus)
            }
            disabled={saving}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="missed">Missed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="edit-visit-notes"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Clinical Notes
          </label>

          <textarea
            id="edit-visit-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            disabled={saving}
            placeholder="Enter relevant visit observations..."
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label
            htmlFor="edit-next-follow-up"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Next Follow-up Date
          </label>

          <input
            id="edit-next-follow-up"
            type="date"
            value={nextFollowUpDate}
            onChange={(event) => setNextFollowUpDate(event.target.value)}
            min={visitDate || undefined}
            disabled={saving}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default WorkerAntenatalVisitEditForm;
