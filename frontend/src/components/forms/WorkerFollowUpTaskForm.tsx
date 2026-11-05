
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ClipboardList,
  Loader2,
  Save,
  X,
} from "lucide-react";

import { patientService } from "../../services/patient.service";
import { pregnancyService } from "../../services/pregnancy.service";
import { antenatalVisitService } from "../../services/antenatalVisit.service";
import { followUpTaskService } from "../../services/followUpTask.service";
import { workerFacilityService } from "../../services/workerFacility.service";

import type { MaternalPatient } from "../../types/patient";
import type { Pregnancy } from "../../types/pregnancy";
import type { AntenatalVisit } from "../../types/antenatalVisit";
import type { FollowUpTask } from "../../types/followUpTask";
import type { WorkerFacilityAssignment } from "../../types/workerFacility";

interface WorkerFollowUpTaskFormProps {
  onSuccess: (task: FollowUpTask) => void;
  onCancel: () => void;
}

const initialDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const WorkerFollowUpTaskForm = ({
  onSuccess,
  onCancel,
}: WorkerFollowUpTaskFormProps) => {
  const [patients, setPatients] = useState<MaternalPatient[]>([]);
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);
  const [visits, setVisits] = useState<AntenatalVisit[]>([]);
  const [facilityAssignments, setFacilityAssignments] = useState<
    WorkerFacilityAssignment[]
  >([]);

  const [patientId, setPatientId] = useState("");
  const [pregnancyId, setPregnancyId] = useState("");
  const [visitId, setVisitId] = useState("");
  const [dueDate, setDueDate] = useState(initialDate());
  const [taskType, setTaskType] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingPregnancies, setLoadingPregnancies] = useState(false);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      patientService.getPatients({
        page: 1,
        page_size: 100,
      }),
      workerFacilityService.getMyFacilities(),
    ])
      .then(([patientResponse, facilityResponse]) => {
        if (!active) return;

        setPatients(patientResponse.patients);
        setFacilityAssignments(facilityResponse);
      })
      .catch(() => {
        if (active) {
          setError("Unable to load patients or facility assignments.");
        }
      })
      .finally(() => {
        if (active) {
          setLoadingPatients(false);
          setLoadingFacilities(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!patientId) return;

    let active = true;

    pregnancyService
      .getPatientPregnancies(patientId)
      .then((data) => {
        if (active) {
          setPregnancies(data);
        }
      })
      .catch(() => {
        if (active) {
          setError("Unable to load pregnancies for this patient.");
        }
      })
      .finally(() => {
        if (active) {
          setLoadingPregnancies(false);
        }
      });

    return () => {
      active = false;
    };
  }, [patientId]);

  useEffect(() => {
    if (!pregnancyId) return;

    let active = true;

    antenatalVisitService
      .getPregnancyVisits(pregnancyId)
      .then((data) => {
        if (active) {
          setVisits(data);
        }
      })
      .catch(() => {
        if (active) {
          setError("Unable to load antenatal visits.");
        }
      })
      .finally(() => {
        if (active) {
          setLoadingVisits(false);
        }
      });

    return () => {
      active = false;
    };
  }, [pregnancyId]);

  const selectedPregnancy = pregnancies.find(
    (pregnancy) => pregnancy.id === pregnancyId
  );

  const matchingAssignment = facilityAssignments.find(
    (assignment) =>
      assignment.facility_id === selectedPregnancy?.facility_id
  );

  const handlePatientChange = (value: string) => {
    setError("");
    setLoadingPregnancies(Boolean(value));
    setLoadingVisits(false);

    setPatientId(value);
    setPregnancyId("");
    setVisitId("");
    setPregnancies([]);
    setVisits([]);
  };

  const handlePregnancyChange = (value: string) => {
    setError("");
    setLoadingVisits(Boolean(value));

    setPregnancyId(value);
    setVisitId("");
    setVisits([]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!patientId || !pregnancyId) {
      setError("Please select a patient and pregnancy.");
      return;
    }

    if (!matchingAssignment) {
      setError(
        "You do not have an active assignment at the selected pregnancy's facility."
      );
      return;
    }

    if (!dueDate || !taskType.trim()) {
      setError("Please provide a due date and task type.");
      return;
    }

    setSubmitting(true);

    try {
      const task = await followUpTaskService.createTask({
        pregnancy_id: pregnancyId,
        antenatal_visit_id: visitId || null,
        assigned_worker_id: matchingAssignment.worker_id,
        due_date: dueDate,
        task_type: taskType.trim(),
        notes: notes.trim() || null,
      });

      onSuccess(task);
    } catch (err) {
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
          : "Unable to create the follow-up task. Please try again.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const activePatients = patients.filter((patient) => patient.is_active);

  const activePregnancies = pregnancies.filter(
    (pregnancy) => pregnancy.pregnancy_status === "ongoing"
  );

  const isInitialLoading = loadingPatients || loadingFacilities;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
              <ClipboardList size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Create Follow-up Task
              </h2>
              <p className="text-sm text-slate-500">
                Schedule maternal care follow-up.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            aria-label="Close form"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
            {error && (
              <div
                role="alert"
                className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
              >
                <AlertCircle size={18} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {isInitialLoading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
                <Loader2 size={20} className="animate-spin text-teal-700" />
                Loading patient and facility information...
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Maternal Patient *
                  </label>

                  <select
                    required
                    value={patientId}
                    onChange={(event) =>
                      handlePatientChange(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="">Select a patient</option>

                    {activePatients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.full_name}
                      </option>
                    ))}
                  </select>

                  {activePatients.length === 0 && (
                    <p className="mt-1 text-xs text-amber-700">
                      No active patients are available.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Pregnancy *
                  </label>

                  <select
                    required
                    value={pregnancyId}
                    disabled={!patientId || loadingPregnancies}
                    onChange={(event) =>
                      handlePregnancyChange(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">
                      {loadingPregnancies
                        ? "Loading pregnancies..."
                        : "Select an ongoing pregnancy"}
                    </option>

                    {activePregnancies.map((pregnancy) => (
                      <option key={pregnancy.id} value={pregnancy.id}>
                        Pregnancy ending{" "}
                        {pregnancy.estimated_due_date ?? "EDD unavailable"}
                      </option>
                    ))}
                  </select>

                  {patientId &&
                    !loadingPregnancies &&
                    activePregnancies.length === 0 && (
                      <p className="mt-1 text-xs text-amber-700">
                        No ongoing pregnancies found for this patient.
                      </p>
                    )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Related Antenatal Visit
                    <span className="ml-1 font-normal text-slate-400">
                      (Optional)
                    </span>
                  </label>

                  <select
                    value={visitId}
                    disabled={!pregnancyId || loadingVisits}
                    onChange={(event) => setVisitId(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">
                      {loadingVisits
                        ? "Loading visits..."
                        : "No related visit"}
                    </option>

                    {visits.map((visit) => (
                      <option key={visit.id} value={visit.id}>
                        {visit.visit_type} — {visit.visit_date}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Assigned Healthcare Worker
                  </label>

                  <div className="rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3">
                    <p className="text-sm font-semibold text-teal-800">
                      Assign to yourself
                    </p>

                    <p className="mt-1 text-xs text-teal-700">
                      {matchingAssignment
                        ? `Facility: ${matchingAssignment.facility.name}`
                        : selectedPregnancy
                          ? "No matching active facility assignment found."
                          : "Select a pregnancy to verify your facility assignment."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Due Date *
                    </label>

                    <div className="relative">
                      <CalendarDays
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        required
                        type="date"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Task Type *
                    </label>

                    <input
                      required
                      type="text"
                      minLength={2}
                      maxLength={100}
                      value={taskType}
                      onChange={(event) => setTaskType(event.target.value)}
                      placeholder="e.g. Follow-up consultation"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Notes
                    <span className="ml-1 font-normal text-slate-400">
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add relevant follow-up instructions..."
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                isInitialLoading ||
                !matchingAssignment ||
                !patientId ||
                !pregnancyId
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkerFollowUpTaskForm;
