
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { facilityService } from "../../services/facility.service";

import type {
  Facility,
  FacilityCreate,
} from "../../types/facility";

type StatusFilter = "all" | "active" | "inactive";

const PAGE_SIZE = 8;

const INITIAL_FORM: FacilityCreate = {
  name: "",
  facility_code: "",
  facility_type: "",
  address: "",
  district: "",
  state: "",
  postal_code: "",
  contact_phone: "",
};

function formatDate(value: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconStyle,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof Building2;
  iconStyle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className={`rounded-xl p-3 ${iconStyle}`}>
          <Icon size={21} />
        </div>
        <span className="text-xs font-medium text-slate-400">{title}</span>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = true,
  minLength,
  maxLength,
  type = "text",
}: {
  label: string;
  name: keyof FacilityCreate;
  value: string;
  onChange: (name: keyof FacilityCreate, value: string) => void;
  placeholder: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  type?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      />
    </div>
  );
}

export default function AdminFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<FacilityCreate>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchFacilities() {
      try {
        const response = await facilityService.getAdminFacilities();

        if (!cancelled) {
          setFacilities(response);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load facilities. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchFacilities();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filteredFacilities = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return facilities.filter((facility) => {
      const matchesSearch =
        !normalizedSearch ||
        facility.name.toLowerCase().includes(normalizedSearch) ||
        facility.facility_code.toLowerCase().includes(normalizedSearch) ||
        facility.facility_type.toLowerCase().includes(normalizedSearch) ||
        facility.district.toLowerCase().includes(normalizedSearch) ||
        facility.state.toLowerCase().includes(normalizedSearch) ||
        facility.address.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && facility.is_active) ||
        (statusFilter === "inactive" && !facility.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [facilities, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredFacilities.length / PAGE_SIZE),
  );

  const paginatedFacilities = filteredFacilities.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const activeCount = facilities.filter(
    (facility) => facility.is_active,
  ).length;

  const inactiveCount = facilities.length - activeCount;

  function handleRefresh() {
    setLoading(true);
    setError("");
    setRefreshKey((previous) => previous + 1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleStatusFilter(value: StatusFilter) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function handleFormChange(
    name: keyof FacilityCreate,
    value: string,
  ) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function closeCreateModal() {
    if (submitting) return;

    setShowCreateModal(false);
    setForm(INITIAL_FORM);
    setFormError("");
  }

  async function handleCreateFacility(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    const cleanedForm: FacilityCreate = {
      name: form.name.trim(),
      facility_code: form.facility_code.trim(),
      facility_type: form.facility_type.trim(),
      address: form.address.trim(),
      district: form.district.trim(),
      state: form.state.trim(),
      postal_code: form.postal_code.trim(),
      contact_phone: form.contact_phone?.trim() || null,
    };

    if (
      cleanedForm.name.length < 2 ||
      cleanedForm.facility_code.length < 2 ||
      cleanedForm.facility_type.length < 2 ||
      cleanedForm.address.length < 5 ||
      cleanedForm.district.length < 2 ||
      cleanedForm.state.length < 2 ||
      cleanedForm.postal_code.length < 4
    ) {
      setFormError("Please enter valid information in all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      await facilityService.createAdminFacility(cleanedForm);

      setShowCreateModal(false);
      setForm(INITIAL_FORM);
      setSuccessMessage("Facility registered successfully.");
      setCurrentPage(1);
      setSearch("");
      setStatusFilter("all");
      setLoading(true);
      setRefreshKey((previous) => previous + 1);
    } catch {
      setFormError(
        "Unable to register the facility. Please verify the details and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-teal-700">
            Administration / Infrastructure
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Facility Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Register, view, and monitor healthcare facilities.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setFormError("");
              setShowCreateModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            <Plus size={17} />
            Add facility
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={19} className="shrink-0" />
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="ml-auto text-emerald-700 hover:text-emerald-900"
            aria-label="Dismiss success message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Infrastructure"
          value={facilities.length}
          description="Total registered facilities"
          icon={Building2}
          iconStyle="bg-teal-50 text-teal-700"
        />

        <SummaryCard
          title="Availability"
          value={activeCount}
          description="Active facilities"
          icon={Activity}
          iconStyle="bg-emerald-50 text-emerald-700"
        />

        <SummaryCard
          title="Account status"
          value={inactiveCount}
          description="Inactive facilities"
          icon={AlertCircle}
          iconStyle="bg-amber-50 text-amber-700"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Facility directory
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Search and review registered healthcare facilities.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => handleSearch(event.target.value)}
                placeholder="Search facilities..."
                aria-label="Search facilities"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                handleStatusFilter(event.target.value as StatusFilter)
              }
              aria-label="Filter facilities by status"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3">
            <RefreshCw
              size={26}
              className="animate-spin text-teal-600"
            />
            <p className="text-sm font-medium text-slate-600">
              Loading facilities...
            </p>
          </div>
        ) : error ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <AlertCircle size={30} className="text-rose-500" />

            <p className="mt-3 font-semibold text-slate-800">
              Unable to load facilities
            </p>

            <p className="mt-1 max-w-sm text-sm text-slate-500">{error}</p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-4 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Try again
            </button>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <Building2 size={34} className="text-slate-300" />

            <p className="mt-3 font-semibold text-slate-800">
              No facilities found
            </p>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {facilities.length === 0
                ? "No facilities have been registered yet."
                : "Try changing your search or status filter."}
            </p>

            {(search || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
                className="mt-4 text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Facility</th>
                    <th className="px-5 py-4">Facility type</th>
                    <th className="px-5 py-4">Location</th>
                    <th className="px-5 py-4">Contact</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Registered</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedFacilities.map((facility) => (
                    <tr
                      key={facility.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                            <Building2 size={19} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {facility.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              Code: {facility.facility_code}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {facility.facility_type}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <MapPin
                            size={15}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />
                          <div>
                            <p>{facility.district}, {facility.state}</p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {facility.postal_code}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {facility.contact_phone ? (
                          <span className="inline-flex items-center gap-2">
                            <Phone size={14} className="text-slate-400" />
                            {facility.contact_phone}
                          </span>
                        ) : (
                          "Not provided"
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge active={facility.is_active} />
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(facility.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>
                {" - "}
                <span className="font-semibold text-slate-700">
                  {Math.min(
                    currentPage * PAGE_SIZE,
                    filteredFacilities.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredFacilities.length}
                </span>{" "}
                facilities
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>

                <span className="min-w-24 text-center text-sm font-medium text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1),
                    )
                  }
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-facility-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  Facility administration
                </p>

                <h2
                  id="create-facility-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Register new facility
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the official facility details below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={submitting}
                aria-label="Close registration form"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateFacility} className="space-y-5 p-5 sm:p-6">
              {formError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>{formError}</p>
                </div>
              )}

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Basic information
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Facility name"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="Enter facility name"
                    minLength={2}
                    maxLength={200}
                  />

                  <FormField
                    label="Facility code"
                    name="facility_code"
                    value={form.facility_code}
                    onChange={handleFormChange}
                    placeholder="Enter unique facility code"
                    minLength={2}
                    maxLength={50}
                  />

                  <FormField
                    label="Facility type"
                    name="facility_type"
                    value={form.facility_type}
                    onChange={handleFormChange}
                    placeholder="e.g. Hospital, PHC, CHC"
                    minLength={2}
                    maxLength={100}
                  />

                  <FormField
                    label="Contact phone"
                    name="contact_phone"
                    value={form.contact_phone ?? ""}
                    onChange={handleFormChange}
                    placeholder="Enter contact number"
                    required={false}
                    maxLength={20}
                    type="tel"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Facility location
                </h3>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="address"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Complete address
                      <span className="ml-1 text-rose-500">*</span>
                    </label>

                    <textarea
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={(event) =>
                        handleFormChange("address", event.target.value)
                      }
                      placeholder="Enter complete facility address"
                      required
                      minLength={5}
                      maxLength={500}
                      rows={3}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField
                      label="District"
                      name="district"
                      value={form.district}
                      onChange={handleFormChange}
                      placeholder="District"
                      minLength={2}
                      maxLength={100}
                    />

                    <FormField
                      label="State"
                      name="state"
                      value={form.state}
                      onChange={handleFormChange}
                      placeholder="State"
                      minLength={2}
                      maxLength={100}
                    />

                    <FormField
                      label="Postal code"
                      name="postal_code"
                      value={form.postal_code}
                      onChange={handleFormChange}
                      placeholder="Postal code"
                      minLength={4}
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Register facility
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
