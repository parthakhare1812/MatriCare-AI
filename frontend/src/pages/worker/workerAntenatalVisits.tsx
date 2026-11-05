
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  Eye,
  Pencil,
  RefreshCw,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";

import WorkerAntenatalVisitForm from "../../components/forms/WorkerAntenatalVisitForm";
import WorkerAntenatalVisitEditForm from "../../components/forms/WorkerAntenatalVisitEditForm";
import WorkerAntenatalVisitDetails from "../../components/shared/WorkerAntenatalVisitDetails";

import { patientService } from "../../services/patient.service";
import { pregnancyService } from "../../services/pregnancy.service";
import { antenatalVisitService } from "../../services/antenatalVisit.service";

import type { MaternalPatient } from "../../types/patient";
import type { Pregnancy } from "../../types/pregnancy";
import type {
  AntenatalVisit,
  FollowUpStatus,
} from "../../types/antenatalVisit";

function formatDate(value: string | null): string {
  if (!value) return "Not scheduled";

  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
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

function WorkerAntenatalVisits() {
  const [patients, setPatients] = useState<MaternalPatient[]>([]);
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);
  const [visits, setVisits] = useState<AntenatalVisit[]>([]);

  const [patientId, setPatientId] = useState("");
  const [pregnancyId, setPregnancyId] = useState("");

  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingPregnancies, setLoadingPregnancies] = useState(false);
  const [loadingVisits, setLoadingVisits] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<AntenatalVisit | null>(
    null
  );
  const [editingVisit, setEditingVisit] = useState<AntenatalVisit | null>(
    null
  );

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
        setVisits([]);
        setSelectedVisit(null);
        setEditingVisit(null);
        return;
      }

      try {
        setLoadingPregnancies(true);
        setError("");
        setPregnancyId("");
        setPregnancies([]);
        setVisits([]);
        setSelectedVisit(null);
        setEditingVisit(null);

        const response =
          await pregnancyService.getPatientPregnancies(patientId);

        setPregnancies(response);
      } catch {
        setError("Unable to load pregnancies for this patient.");
      } finally {
        setLoadingPregnancies(false);
      }
    };

    void loadPregnancies();
  }, [patientId]);

  useEffect(() => {
    const loadVisits = async () => {
      if (!pregnancyId) {
        setVisits([]);
        return;
      }

      try {
        setLoadingVisits(true);
        setError("");

        const response =
          await antenatalVisitService.getPregnancyVisits(pregnancyId);

        setVisits(
          [...response].sort(
            (a, b) =>
              new Date(b.visit_date).getTime() -
              new Date(a.visit_date).getTime()
          )
        );
      } catch {
        setError("Unable to load antenatal visit records.");
      } finally {
        setLoadingVisits(false);
      }
    };

    void loadVisits();
  }, [pregnancyId]);

  const handleVisitSuccess = (visit: AntenatalVisit) => {
    setVisits((current) =>
      [visit, ...current.filter((item) => item.id !== visit.id)].sort(
        (a, b) =>
          new Date(b.visit_date).getTime() -
          new Date(a.visit_date).getTime()
      )
    );

    setShowForm(false);
    setError("");
  };

  const handleEditSuccess = (updatedVisit: AntenatalVisit) => {
    setVisits((current) =>
      current
        .map((visit) =>
          visit.id === updatedVisit.id ? updatedVisit : visit
        )
        .sort(
          (a, b) =>
            new Date(b.visit_date).getTime() -
            new Date(a.visit_date).getTime()
        )
    );

    setSelectedVisit(null);
    setEditingVisit(null);
    setError("");
  };

  const handleRefresh = async () => {
    if (!pregnancyId) return;

    try {
      setLoadingVisits(true);
      setError("");

      const response =
        await antenatalVisitService.getPregnancyVisits(pregnancyId);

      setVisits(
        [...response].sort(
          (a, b) =>
            new Date(b.visit_date).getTime() -
            new Date(a.visit_date).getTime()
        )
      );
    } catch {
      setError("Unable to refresh antenatal visit records.");
    } finally {
      setLoadingVisits(false);
    }
  };

  const selectedPatient = patients.find(
    (patient) => patient.id === patientId
  );

  const selectedPregnancy = pregnancies.find(
    (pregnancy) => pregnancy.id === pregnancyId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Antenatal Visits
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage and review antenatal care visit records.
          </p>
        </div>

        <Button
          onClick={() => setShowForm(true)}
          disabled={!pregnancyId || showForm || Boolean(editingVisit)}
        >
          <CalendarPlus size={17} className="mr-2" />
          Register Visit
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card padding="lg">
        <div className="mb-5">
          <h2 className="font-semibold text-slate-900">
            Select Patient and Pregnancy
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose a patient to view their pregnancy records and visit history.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="antenatal-patient"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Patient
            </label>

            <select
              id="antenatal-patient"
              value={patientId}
              onChange={(event) => {
                setPatientId(event.target.value);
                setShowForm(false);
              }}
              disabled={loadingPatients}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">
                {loadingPatients ? "Loading patients..." : "Select patient"}
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
              htmlFor="antenatal-pregnancy"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Pregnancy
            </label>

            <select
              id="antenatal-pregnancy"
              value={pregnancyId}
              onChange={(event) => {
                setPregnancyId(event.target.value);
                setShowForm(false);
                setSelectedVisit(null);
                setEditingVisit(null);
              }}
              disabled={!patientId || loadingPregnancies}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="">
                {!patientId
                  ? "Select a patient first"
                  : loadingPregnancies
                    ? "Loading pregnancies..."
                    : "Select pregnancy"}
              </option>

              {pregnancies.map((pregnancy) => (
                <option key={pregnancy.id} value={pregnancy.id}>
                  {pregnancy.pregnancy_status.toUpperCase()} ·{" "}
                  {pregnancy.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedPatient && (
          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Selected Patient
            </p>
            <p className="mt-1 font-semibold text-slate-800">
              {selectedPatient.full_name}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {selectedPatient.district}, {selectedPatient.state}
            </p>
          </div>
        )}
      </Card>

      {selectedPregnancy && (
        <Card padding="lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays size={19} className="text-brand-600" />
                <h2 className="font-semibold text-slate-900">
                  Pregnancy Overview
                </h2>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Pregnancy ID: {selectedPregnancy.id}
              </p>
            </div>

            <Badge variant="info">
              {selectedPregnancy.pregnancy_status}
            </Badge>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-400">Last Menstrual Period</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {formatDate(selectedPregnancy.last_menstrual_period)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Estimated Due Date</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {formatDate(selectedPregnancy.estimated_due_date)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {showForm && pregnancyId && (
        <WorkerAntenatalVisitForm
          onSuccess={handleVisitSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingVisit && (
        <WorkerAntenatalVisitEditForm
          visit={editingVisit}
          onSuccess={handleEditSuccess}
          onCancel={() => {
            setEditingVisit(null);
            setSelectedVisit(null);
          }}
        />
      )}

      {pregnancyId && (
        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Visit History
              </h2>
              <p className="text-sm text-slate-500">
                Antenatal visits recorded for the selected pregnancy.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loadingVisits}
            >
              <RefreshCw
                size={15}
                className={`mr-2 ${loadingVisits ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {loadingVisits ? (
            <Card padding="lg">
              <div className="flex items-center justify-center gap-3 py-8 text-sm text-slate-500">
                <RefreshCw size={18} className="animate-spin" />
                Loading antenatal visits...
              </div>
            </Card>
          ) : visits.length === 0 ? (
            <Card padding="lg">
              <div className="flex flex-col items-center py-10 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <ClipboardList size={25} />
                </div>

                <h3 className="font-semibold text-slate-800">
                  No Antenatal Visits Found
                </h3>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  No visit records are available for this pregnancy yet.
                </p>

                <Button
                  className="mt-5"
                  onClick={() => setShowForm(true)}
                  disabled={showForm}
                >
                  <CalendarPlus size={16} className="mr-2" />
                  Register First Visit
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {visits.map((visit) => (
                <Card key={visit.id} padding="lg">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {visit.visit_type}
                        </h3>

                        <Badge
                          variant={getStatusVariant(visit.follow_up_status)}
                        >
                          {visit.follow_up_status}
                        </Badge>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-slate-400">
                            Visit Date
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatDate(visit.visit_date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">
                            Next Follow-up
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatDate(visit.next_follow_up_date)}
                          </p>
                        </div>
                      </div>

                      {visit.notes && (
                        <div className="mt-4 rounded-lg bg-slate-50 p-3">
                          <p className="text-xs font-medium text-slate-500">
                            Clinical Notes
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                            {visit.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVisit(visit);
                          setEditingVisit(null);
                          setShowForm(false);
                        }}
                      >
                        <Eye size={15} className="mr-1.5" />
                        Details
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingVisit(visit);
                          setSelectedVisit(null);
                          setShowForm(false);
                        }}
                      >
                        <Pencil size={15} className="mr-1.5" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {!patientId && (
        <Card padding="lg">
          <div className="flex flex-col items-center py-8 text-center">
            <ClipboardList size={30} className="mb-3 text-slate-300" />
            <h3 className="font-semibold text-slate-800">
              Select a Patient
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Select a patient and pregnancy to access antenatal visit history.
            </p>
          </div>
        </Card>
      )}

      {selectedVisit && (
        <WorkerAntenatalVisitDetails
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onEdit={() => {
            setEditingVisit(selectedVisit);
            setSelectedVisit(null);
          }}
        />
      )}
    </div>
  );
}

export default WorkerAntenatalVisits;
