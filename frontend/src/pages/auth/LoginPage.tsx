
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import axios from "axios";

import { useAuth } from "../../context/useAuth";
import type { UserRole } from "../../types/auth";

function getDashboardPath(role: UserRole): string {
  return role === "admin" ? "/admin" : "/worker";
}

function getLoginError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    if (status === 401) {
      return "The email or password you entered is incorrect.";
    }

    if (status === 403) {
      return typeof detail === "string"
        ? detail
        : "Your account is inactive. Please contact your administrator.";
    }

    if (!error.response) {
      return "Unable to connect to MatriCare AI. Please check your connection and try again.";
    }

    return typeof detail === "string"
      ? detail
      : "Something went wrong. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to sign in. Please try again.";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const authenticatedUser = await login({
        email: normalizedEmail,
        password,
      });

      navigate(getDashboardPath(authenticatedUser.role), {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(getLoginError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || (isAuthenticated && user)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f8f8]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f3f1] text-[#087f8c]">
            <HeartPulse size={25} />
          </div>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#087f8c] border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">
            Preparing your workspace...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f8f8]">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden overflow-hidden bg-[#103c3e] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
          <div className="absolute -right-32 -top-32 h-[430px] w-[430px] rounded-full border border-white/10" />
          <div className="absolute -right-16 -top-16 h-[300px] w-[300px] rounded-full border border-white/10" />
          <div className="absolute -bottom-44 -left-32 h-[480px] w-[480px] rounded-full border border-white/10" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <HeartPulse size={25} />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">MatriCare AI</p>
              <p className="text-[11px] font-medium tracking-[0.19em] text-teal-100/70">
                MATERNAL CARE INTELLIGENCE
              </p>
            </div>
          </div>

          <div className="relative z-10 max-w-xl py-16">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-teal-100/20 bg-white/[0.07] px-4 py-2 text-xs font-medium text-teal-50">
              <Activity size={14} />
              Connected care. Timely follow-ups.
            </div>

            <h1 className="text-4xl font-semibold leading-[1.16] tracking-tight xl:text-5xl">
              Every mother deserves
              <span className="mt-2 block text-[#83d5c8]">
                continuous care.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-teal-50/75">
              A unified maternal healthcare workspace designed to help care
              teams coordinate follow-ups, monitor pregnancies, and keep
              important care activities on track.
            </p>

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#83d5c8]/15 text-[#a6e7dc]">
                  <Stethoscope size={20} />
                </div>
                <p className="font-semibold">Coordinated care</p>
                <p className="mt-2 text-sm leading-6 text-teal-50/65">
                  Bring maternal care workflows into one workspace.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#83d5c8]/15 text-[#a6e7dc]">
                  <ShieldCheck size={20} />
                </div>
                <p className="font-semibold">Role-based access</p>
                <p className="mt-2 text-sm leading-6 text-teal-50/65">
                  Dedicated workspaces for administrators and care teams.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-teal-50/50">
            <span>MatriCare AI · Maternal Care Follow-up</span>
            <span>Secure workspace</span>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-20">
          <div className="w-full max-w-[440px]">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#087f8c] text-white">
                <HeartPulse size={25} />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-[#103c3e]">
                  MatriCare AI
                </p>
                <p className="text-[10px] font-semibold tracking-[0.17em] text-slate-400">
                  MATERNAL CARE INTELLIGENCE
                </p>
              </div>
            </div>

            <div className="mb-9">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#087f8c]">
                Welcome back
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-[#243746] sm:text-[34px]">
                Sign in to your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Access your maternal healthcare workspace and continue where
                your care team left off.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@organization.com"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#087f8c] focus:ring-4 focus:ring-[#087f8c]/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#087f8c] focus:ring-4 focus:ring-[#087f8c]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#087f8c] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(8,127,140,0.16)] transition hover:bg-[#076d78] hover:shadow-[0_10px_24px_rgba(8,127,140,0.23)] focus:outline-none focus:ring-4 focus:ring-[#087f8c]/20 disabled:cursor-not-allowed disabled:opacity-65"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in securely
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-4">
              <ShieldCheck size={19} className="mt-0.5 shrink-0 text-[#087f8c]" />
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Authorized access only
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Sign in using the account credentials provided by your
                  MatriCare administrator.
                </p>
              </div>
            </div>

            <p className="mt-10 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} MatriCare AI. All rights reserved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
