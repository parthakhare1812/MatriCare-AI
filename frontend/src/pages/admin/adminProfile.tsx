
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import { useAuth } from "../../context/useAuth";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function ProfileField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4">
      <div className="rounded-lg bg-teal-50 p-2.5 text-teal-700">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  const Icon = enabled ? CheckCircle2 : XCircle;

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          enabled
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        <Icon size={14} />
        {enabled ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

export default function AdminProfile() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
        Unable to load your profile. Please sign in again.
      </div>
    );
  }

  const initials = user.full_name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="min-h-full bg-[#f5f8f8]">
      <div className="mx-auto max-w-5xl space-y-7 p-4 sm:p-6 lg:p-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Admin</span>
            <span>/</span>
            <span className="text-teal-700">Profile</span>
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              My Profile
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View your MatriCare AI administrator account information.
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-teal-800 to-teal-600" />

          <div className="px-6 pb-6">
            <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-teal-100 text-2xl font-bold text-teal-800 shadow-sm">
                  {initials || "A"}
                </div>

                <div className="pb-1">
                  <h2 className="text-xl font-bold text-slate-900">
                    {user.full_name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Administrator
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <ShieldCheck size={15} />
                Admin account
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Personal information
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Information associated with your authenticated account.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileField
              label="Full name"
              value={user.full_name}
              icon={UserRound}
            />

            <ProfileField
              label="Email address"
              value={user.email}
              icon={Mail}
            />

            <ProfileField
              label="Account role"
              value={user.role === "admin" ? "Administrator" : user.role}
              icon={ShieldCheck}
            />

            <ProfileField
              label="Account created"
              value={formatDate(user.created_at)}
              icon={CalendarDays}
            />

            <ProfileField
              label="User ID"
              value={user.id}
              icon={UserRound}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck size={19} className="text-teal-700" />
            <h2 className="text-base font-semibold text-slate-900">
              Account status
            </h2>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            <StatusItem
              label="Account status"
              enabled={user.is_active}
            />
            <StatusItem
              label="Email verification"
              enabled={user.is_verified}
            />
          </div>
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <Clock3 size={19} className="mt-0.5 shrink-0 text-blue-700" />
          <div>
            <h2 className="text-sm font-semibold text-blue-900">
              Profile management
            </h2>
            <p className="mt-1 text-sm leading-6 text-blue-800">
              Profile information is currently read-only. Changes to account
              details require backend support and appropriate authorization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
