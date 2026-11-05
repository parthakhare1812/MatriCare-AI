
import { useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { AlertCircle, Loader2, UserPlus, X } from "lucide-react";

import { patientService } from "../../services/patient.service";
import type {
  MaternalPatient,
  MaternalPatientCreate,
} from "../../types/patient";

interface WorkerPatientFormProps {
  onSuccess: (patient: MaternalPatient) => void;
  onCancel: () => void;
}

const initialForm: MaternalPatientCreate = {
  full_name: "",
  date_of_birth: "",
  phone: "",
  address: "",
  district: "",
  state: "",
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item: { msg?: string }) => item.msg ?? "Invalid field")
        .join(", ");
    }

    if (!error.response) {
      return "Unable to connect to the server. Check that the backend is running.";
    }

    return error.message || "The registration request could not be completed.";
  }

  return "Something went wrong. Please try again.";
}

function WorkerPatientForm({
  onSuccess,
  onCancel,
}: WorkerPatientFormProps) {
  const [form, setForm] = useState<MaternalPatientCreate>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    field: keyof MaternalPatientCreate,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const payload: MaternalPatientCreate = {
      full_name: form.full_name.trim(),
      date_of_birth: form.date_of_birth,
      phone: form.phone.trim(),
      address: form.address.trim(),
      district: form.district.trim(),
      state: form.state.trim(),
    };

    if (
      payload.full_name.length < 2 ||
      payload.address.length < 5 ||
      payload.district.length < 2 ||
      payload.state.length < 2 ||
      payload.phone.length < 10 ||
      payload.phone.length > 20
    ) {
      setError("Please check all fields and their required lengths.");
      return;
    }

    setIsSubmitting(true);

    try {
      const patient = await patientService.registerPatient(payload);
      setForm(initialForm);
      onSuccess(patient);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50";

  const labelClass = "text-sm font-semibold text-slate-700";

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <UserPlus size={21} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Register new patient
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Enter the maternal patient details
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Close registration form"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-6">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Personal information
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Provide the patient's basic identification details.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="patient-full-name" className={labelClass}>
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="patient-full-name"
              type="text"
              required
              minLength={2}
              maxLength={150}
              autoComplete="name"
              value={form.full_name}
              onChange={(event) =>
                handleChange("full_name", event.target.value)
              }
              placeholder="Enter patient's full name"
              className={inputClass}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="patient-dob" className={labelClass}>
              Date of birth <span className="text-red-500">*</span>
            </label>
            <input
              id="patient-dob"
              type="date"
              required
              value={form.date_of_birth}
              onChange={(event) =>
                handleChange("date_of_birth", event.target.value)
              }
              className={inputClass}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="patient-phone" className={labelClass}>
              Phone number <span className="text-red-500">*</span>
            </label>
            <input
              id="patient-phone"
              type="tel"
              required
              minLength={10}
              maxLength={20}
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => handleChange("phone", event.target.value)}
              placeholder="Enter phone number"
              className={inputClass}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="text-sm font-bold text-slate-900">
            Address information
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Provide the patient's residential location.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="patient-address" className={labelClass}>
              Complete address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="patient-address"
              required
              minLength={5}
              maxLength={300}
              rows={3}
              autoComplete="street-address"
              value={form.address}
              onChange={(event) =>
                handleChange("address", event.target.value)
              }
              placeholder="Enter house number, street, locality and other address details"
              className={`${inputClass} resize-y`}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {form.address.length}/300
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="patient-district" className={labelClass}>
                District <span className="text-red-500">*</span>
              </label>
              <input
                id="patient-district"
                type="text"
                required
                minLength={2}
                maxLength={100}
                autoComplete="address-level2"
                value={form.district}
                onChange={(event) =>
                  handleChange("district", event.target.value)
                }
                placeholder="Enter district"
                className={inputClass}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="patient-state" className={labelClass}>
                State <span className="text-red-500">*</span>
              </label>
              <input
                id="patient-state"
                type="text"
                required
                minLength={2}
                maxLength={100}
                autoComplete="address-level1"
                value={form.state}
                onChange={(event) =>
                  handleChange("state", event.target.value)
                }
                placeholder="Enter state"
                className={inputClass}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
          <p className="text-xs leading-5 text-teal-800">
            The patient will automatically be registered under your active
            primary healthcare facility. Facility assignment is handled by
            the backend.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <UserPlus size={17} />
                Register patient
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

export default WorkerPatientForm;
