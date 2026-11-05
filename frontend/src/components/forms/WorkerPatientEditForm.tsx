import { useState, type FormEvent } from "react";
import { AlertCircle, Loader2, Save, X } from "lucide-react";
import axios from "axios";
import Button from "../ui/Button";
import { patientService } from "../../services/patient.service";
import type {
  MaternalPatient,
  MaternalPatientUpdate,
} from "../../types/patient";

interface WorkerPatientEditFormProps {
  patient: MaternalPatient;
  onSuccess: (patient: MaternalPatient) => void;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

function WorkerPatientEditForm({
  patient,
  onSuccess,
  onCancel,
}: WorkerPatientEditFormProps) {
  const [formData, setFormData] = useState<MaternalPatientUpdate>({
    full_name: patient.full_name,
    date_of_birth: patient.date_of_birth,
    phone: patient.phone,
    address: patient.address,
    district: patient.district,
    state: patient.state,
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    field: keyof MaternalPatientUpdate,
    value: string,
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (
      !formData.full_name?.trim() ||
      !formData.date_of_birth ||
      !formData.phone?.trim() ||
      !formData.address?.trim() ||
      !formData.district?.trim() ||
      !formData.state?.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (formData.full_name.trim().length < 2) {
      setError("Full name must contain at least 2 characters.");
      return;
    }

    if (formData.phone.trim().length < 10 || formData.phone.trim().length > 20) {
      setError("Phone number must contain between 10 and 20 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedPatient = await patientService.updatePatient(
        patient.id,
        {
          full_name: formData.full_name.trim(),
          date_of_birth: formData.date_of_birth,
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          district: formData.district.trim(),
          state: formData.state.trim(),
        },
      );

      onSuccess(updatedPatient);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ||
            "Unable to update patient details. Please try again.",
        );
      } else {
        setError("Something went wrong while updating the patient.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Edit Patient Details
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Update the patient's registered information.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          aria-label="Close edit form"
        >
          <X size={20} />
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.full_name ?? ""}
              onChange={(event) =>
                handleChange("full_name", event.target.value)
              }
              className={inputClass}
              minLength={2}
              maxLength={150}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Date of Birth *
            </label>
            <input
              type="date"
              value={formData.date_of_birth ?? ""}
              onChange={(event) =>
                handleChange("date_of_birth", event.target.value)
              }
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone ?? ""}
              onChange={(event) => handleChange("phone", event.target.value)}
              className={inputClass}
              minLength={10}
              maxLength={20}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              District *
            </label>
            <input
              type="text"
              value={formData.district ?? ""}
              onChange={(event) =>
                handleChange("district", event.target.value)
              }
              className={inputClass}
              minLength={2}
              maxLength={100}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              State *
            </label>
            <input
              type="text"
              value={formData.state ?? ""}
              onChange={(event) => handleChange("state", event.target.value)}
              className={inputClass}
              minLength={2}
              maxLength={100}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Address *
            </label>
            <textarea
              value={formData.address ?? ""}
              onChange={(event) =>
                handleChange("address", event.target.value)
              }
              className={`${inputClass} min-h-24 resize-y`}
              minLength={5}
              maxLength={300}
              required
            />
          </div>
        </div>

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            leftIcon={
              isSubmitting ? undefined : <Save size={16} />
            }
          >
            {isSubmitting ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {isSubmitting && (
        <div className="sr-only" aria-live="polite">
          <Loader2 />
          Saving patient information
        </div>
      )}
    </div>
  );
}

export default WorkerPatientEditForm;