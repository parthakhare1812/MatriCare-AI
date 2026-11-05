
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, CalendarPlus, Loader2 } from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";

import { patientService } from "../../services/patient.service";
import { pregnancyService } from "../../services/pregnancy.service";
import { antenatalVisitService } from "../../services/antenatalVisit.service";

import type { MaternalPatient } from "../../types/patient";
import type { Pregnancy } from "../../types/pregnancy";
import type { AntenatalVisit } from "../../types/antenatalVisit";

interface WorkerAntenatalVisitFormProps {
  onSuccess: (visit: AntenatalVisit) => void;
  onCancel: () => void;
}

function WorkerAntenatalVisitForm({
  onSuccess,
  onCancel,
}: WorkerAntenatalVisitFormProps) {
  const [patients, setPatients] = useState<MaternalPatient[]>([]);
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);

  const [patientId, setPatientId] = useState("");
  const [pregnancyId, setPregnancyId] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitType, setVisitType] = useState("");
  const [notes, setNotes] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");

  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingPregnancies, setLoadingPregnancies] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoadingPatients(true);

        const response = await patientService.getPatients({
          page: 1,
          page_size: 100,
        });

        setPatients(
          response.patients.filter((patient) => patient.is_active)
        );
      } catch {
        setError("Unable to load patients. Please try again.");
      } finally {
        setLoadingPatients(false);
      }
    };

    void loadPatients();
  }, []);

  useEffect(() => {
    const loadPregnancies = async () => {
      if (!patientId) {
        setPregnancies([]);
        setPregnancyId("");
        return;
      }

      try {
        setLoadingPregnancies(true);
        setPregnancyId("");
        setError("");

        const response =
          await pregnancyService.getPatientPregnancies(patientId);

        setPregnancies(
          response.filter(
            (pregnancy) => pregnancy.pregnancy_status === "ongoing"
          )
        );
      } catch {
        setPregnancies([]);
        setError("Unable to load pregnancies for this patient.");
      } finally {
        setLoadingPregnancies(false);
      }
    };

    void loadPregnancies();
  }, [patientId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!pregnancyId) {
      setError("Please select a pregnancy.");
      return;
    }

    if (
      nextFollowUpDate &&
      visitDate &&
      nextFollowUpDate < visitDate
    ) {
      setError("Next follow-up date cannot be earlier than visit date.");
      return;
    }

    try {
      setSaving(true);

      const visit = await antenatalVisitService.registerVisit({
        pregnancy_id: pregnancyId,
        visit_date: visitDate,
        visit_type: visitType.trim(),
        notes: notes.trim() || null,
        next_follow_up_date: nextFollowUpDate || null,
      });

      onSuccess(visit);
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
          : "Unable to register the antenatal visit. Please try again.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="lg">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <CalendarPlus size={21} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Register Antenatal Visit
          </h2>
          <p className="text-sm text-slate-500">
            Record a patient's antenatal care visit.
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
        <div>
          <label
            htmlFor="visit-patient"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Select Patient *
          </label>

          <select
            id="visit-patient"
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            disabled={loadingPatients || saving}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">
              {loadingPatients ? "Loading patients..." : "Choose a patient"}
            </option>

            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="visit-pregnancy"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Select Ongoing Pregnancy *
          </label>

          <select
            id="visit-pregnancy"
            value={pregnancyId}
            onChange={(event) => setPregnancyId(event.target.value)}
            disabled={!patientId || loadingPregnancies || saving}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          >
            <option value="">
              {!patientId
                ? "Select a patient first"
                : loadingPregnancies
                  ? "Loading pregnancies..."
                  : "Choose a pregnancy"}
            </option>

            {pregnancies.map((pregnancy) => (
              <option key={pregnancy.id} value={pregnancy.id}>
                Pregnancy · {pregnancy.id.slice(0, 8)}
              </option>
            ))}
          </select>

          {patientId &&
            !loadingPregnancies &&
            pregnancies.length === 0 && (
              <p className="mt-1.5 text-xs text-amber-600">
                No ongoing pregnancies found for this patient.
              </p>
            )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="visit-date"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Visit Date *
            </label>

            <input
              id="visit-date"
              type="date"
              value={visitDate}
              onChange={(event) => setVisitDate(event.target.value)}
              max={new Date().toISOString().split("T")[0]}
              disabled={saving}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label
              htmlFor="visit-type"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Visit Type *
            </label>

            <input
              id="visit-type"
              type="text"
              value={visitType}
              onChange={(event) => setVisitType(event.target.value)}
              minLength={2}
              maxLength={50}
              placeholder="e.g. Routine check-up"
              disabled={saving}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="visit-notes"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Clinical Notes
          </label>

          <textarea
            id="visit-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Enter relevant visit observations..."
            disabled={saving}
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label
            htmlFor="next-follow-up"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Next Follow-up Date
          </label>

          <input
            id="next-follow-up"
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

          <Button
            type="submit"
            disabled={
              saving ||
              loadingPatients ||
              loadingPregnancies ||
              !pregnancyId
            }
          >
            {saving ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              "Register Visit"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default WorkerAntenatalVisitForm;
