
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  LogOut,
  Mail,
  MapPin,
  RefreshCw,
  ShieldCheck,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "../../context/useAuth";
import { workerFacilityService } from "../../services/workerFacility.service";

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="rounded-lg bg-white p-2 text-teal-700 shadow-sm">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function WorkerSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const {
    data: assignments = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["worker-settings-facilities"],
    queryFn: workerFacilityService.getMyFacilities,
    enabled: Boolean(user),
  });

  const handleLogout = () => {
    logout();
    toast.success("You have been logged out.");
    navigate("/login", { replace: true });
  };

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <ShieldCheck className="mx-auto text-slate-400" size={32} />
        <h2 className="mt-3 text-lg font-semibold text-slate-800">
          Account information unavailable
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Please sign in again to access your settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-teal-700">
            Account Management
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View your account information and assigned healthcare facilities.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={isFetching ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <User size={30} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-slate-900">
              {user.full_name}
            </h2>
            <p className="mt-1 break-all text-sm text-slate-500">
              {user.email}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold capitalize text-teal-800">
                {user.role.replaceAll("_", " ")}
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  user.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <Activity size={12} />
                {user.is_active ? "Active account" : "Inactive account"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="mb-4 text-base font-bold text-slate-900">
            Account Information
          </h3>

          <div className="grid gap-3 md:grid-cols-2">
            <DetailItem
              icon={User}
              label="Full Name"
              value={user.full_name}
            />

            <DetailItem
              icon={Mail}
              label="Email Address"
              value={user.email}
            />

            <DetailItem
              icon={ShieldCheck}
              label="Account Role"
              value={user.role.replaceAll("_", " ")}
            />

            <DetailItem
              icon={CalendarDays}
              label="Member Since"
              value={formatDate(user.created_at)}
            />

            <DetailItem
              icon={CheckCircle2}
              label="Verification Status"
              value={user.is_verified ? "Verified" : "Not verified"}
            />

            <DetailItem
              icon={Activity}
              label="Account Status"
              value={user.is_active ? "Active" : "Inactive"}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="text-teal-700" size={20} />
              <h2 className="text-lg font-bold text-slate-900">
                Assigned Facilities
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Healthcare facilities associated with your worker account.
            </p>
          </div>

          {!isLoading && !isError && (
            <span className="w-fit rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
              {assignments.length}{" "}
              {assignments.length === 1 ? "facility" : "facilities"}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <RefreshCw className="animate-spin" size={18} />
            Loading assigned facilities...
          </div>
        ) : isError ? (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">
              Unable to load assigned facilities.
            </p>
            <p className="mt-1 text-sm text-red-600">
              {error instanceof Error
                ? error.message
                : "Please try again."}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 text-sm font-semibold text-red-700 underline"
            >
              Try again
            </button>
          </div>
        ) : assignments.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <Building2
              className="mx-auto text-slate-400"
              size={30}
            />
            <p className="mt-3 font-semibold text-slate-700">
              No assigned facilities
            </p>
            <p className="mt-1 text-sm text-slate-500">
              No facility assignments are currently associated with your account.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {assignments.map((assignment) => (
              <article
                key={`${assignment.worker_id}-${assignment.facility_id}`}
                className="rounded-xl border border-slate-200 p-5 transition hover:border-teal-200 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
                      <Building2 size={21} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="break-words font-bold text-slate-900">
                        {assignment.facility.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {assignment.facility.facility_code}
                      </p>
                    </div>
                  </div>

                  {assignment.is_primary && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Primary
                    </span>
                  )}
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin
                      size={16}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />
                    <span>
                      {assignment.facility.address},{" "}
                      {assignment.facility.district},{" "}
                      {assignment.facility.state} -{" "}
                      {assignment.facility.postal_code}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building2
                      size={16}
                      className="shrink-0 text-slate-400"
                    />
                    <span>
                      {assignment.facility.facility_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock
                      size={16}
                      className="shrink-0 text-slate-400"
                    />
                    <span>
                      Assigned on {formatDate(assignment.assigned_at)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">
              Session Management
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign out of your MatriCare AI healthcare worker account.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </section>
    </div>
  );
}
