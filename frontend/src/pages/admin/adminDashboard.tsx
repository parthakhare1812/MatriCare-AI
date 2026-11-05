
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  HeartPulse,
  Hospital,
  RefreshCw,
  ShieldAlert,
  Users,
  UserRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "axios";

import { api } from "../../lib/api";

interface AdminDashboardData {
  total_patients: number;
  active_healthcare_workers: number;
  total_facilities: number;
  ongoing_pregnancies: number;
  total_antenatal_visits: number;
  pending_follow_ups: number;
  upcoming_follow_ups: number;
  overdue_follow_ups: number;
  open_escalations: number;
}

interface FollowUpTrendItem {
  date: string;
  created: number;
  completed: number;
  missed: number;
}

interface FollowUpTrendResponse {
  total: number;
  trends: FollowUpTrendItem[];
}

interface FacilityPerformanceItem {
  facility_id: string;
  facility_name: string;
  total_patients: number;
  ongoing_pregnancies: number;
  pending_follow_ups: number;
  overdue_follow_ups: number;
}

interface FacilityPerformanceResponse {
  total: number;
  facilities: FacilityPerformanceItem[];
}

type TrendPeriod = 7 | 30 | 90;

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (!error.response) {
      return "Unable to connect to the backend. Please check that the server is running.";
    }

    return error.message || "The request could not be completed.";
  }

  return "Something went wrong while loading the dashboard.";
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-IN");
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof Users;
  accent: "teal" | "blue" | "violet" | "amber" | "red";
}) {
  const accentStyles = {
    teal: "bg-teal-50 text-teal-700",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {formatNumber(value)}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${accentStyles[accent]}`}>
          <Icon size={22} />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">{description}</p>
    </article>
  );
}

function ChartCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-xl bg-slate-50 px-5 text-center">
      <div>
        <Activity size={25} className="mx-auto text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [trends, setTrends] = useState<FollowUpTrendItem[]>([]);
  const [facilities, setFacilities] = useState<FacilityPerformanceItem[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>(7);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [trendError, setTrendError] = useState("");
  const [facilityError, setFacilityError] = useState("");

  const loadDashboard = useCallback(async (period: TrendPeriod) => {
    setError("");
    setTrendError("");
    setFacilityError("");

    try {
      const [dashboardResult, trendResult, facilityResult] =
        await Promise.allSettled([
          api.get<AdminDashboardData>("/admin/dashboard/"),
          api.get<FollowUpTrendResponse>(
            `/admin/dashboard/follow-up-trends?days=${period}`,
          ),
          api.get<FacilityPerformanceResponse>(
            "/admin/dashboard/facility-performance",
          ),
        ]);

      if (dashboardResult.status === "fulfilled") {
        setDashboard(dashboardResult.value.data);
      } else {
        setError(getErrorMessage(dashboardResult.reason));
      }

      if (trendResult.status === "fulfilled") {
        setTrends(trendResult.value.data.trends ?? []);
      } else {
        setTrendError(getErrorMessage(trendResult.reason));
      }

      if (facilityResult.status === "fulfilled") {
        setFacilities(facilityResult.value.data.facilities ?? []);
      } else {
        setFacilityError(getErrorMessage(facilityResult.reason));
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      await Promise.resolve();

      if (!cancelled) {
        await loadDashboard(trendPeriod);
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [loadDashboard, trendPeriod]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboard(trendPeriod);
  };

  const metricCards = dashboard
    ? [
        {
          title: "Total patients",
          value: dashboard.total_patients,
          description: "Registered maternal patient records",
          icon: Users,
          accent: "teal" as const,
        },
        {
          title: "Healthcare workers",
          value: dashboard.active_healthcare_workers,
          description: "Currently active healthcare workers",
          icon: UserRound,
          accent: "blue" as const,
        },
        {
          title: "Healthcare facilities",
          value: dashboard.total_facilities,
          description: "Registered healthcare facilities",
          icon: Hospital,
          accent: "violet" as const,
        },
        {
          title: "Ongoing pregnancies",
          value: dashboard.ongoing_pregnancies,
          description: "Currently ongoing pregnancy records",
          icon: HeartPulse,
          accent: "teal" as const,
        },
        {
          title: "Antenatal visits",
          value: dashboard.total_antenatal_visits,
          description: "Total recorded antenatal visits",
          icon: CalendarCheck,
          accent: "blue" as const,
        },
        {
          title: "Pending follow-ups",
          value: dashboard.pending_follow_ups,
          description: "Follow-up tasks awaiting completion",
          icon: ClipboardList,
          accent: "amber" as const,
        },
        {
          title: "Upcoming follow-ups",
          value: dashboard.upcoming_follow_ups,
          description: "Scheduled upcoming follow-ups",
          icon: CalendarClock,
          accent: "violet" as const,
        },
        {
          title: "Overdue follow-ups",
          value: dashboard.overdue_follow_ups,
          description: "Follow-ups requiring attention",
          icon: AlertCircle,
          accent: "red" as const,
        },
        {
          title: "Open escalations",
          value: dashboard.open_escalations,
          description: "Escalations that remain unresolved",
          icon: ShieldAlert,
          accent: "red" as const,
        },
      ]
    : [];

  const attentionCount = dashboard
    ? dashboard.overdue_follow_ups + dashboard.open_escalations
    : 0;

  const trendChartData = trends.map((item) => ({
    ...item,
    date: formatDate(item.date),
  }));

  const facilityChartData = facilities.map((facility) => ({
    name:
      facility.facility_name.length > 18
        ? `${facility.facility_name.slice(0, 18)}…`
        : facility.facility_name,
    patients: facility.total_patients,
    overdue: facility.overdue_follow_ups,
  }));

  const isInitialLoading = isLoading && !dashboard;

  return (
    <main className="min-h-full bg-[#f5f8f8]">
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
              <Activity size={15} />
              Admin workspace
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Dashboard Overview
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Monitor maternal care activity, follow-up operations, and
              facility performance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-center"
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? "animate-spin" : ""}
            />
            Refresh data
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center"
          >
            <AlertCircle size={20} className="shrink-0 text-red-600" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-800">
                Dashboard data could not be loaded
              </p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {isInitialLoading ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white">
            <RefreshCw size={28} className="animate-spin text-teal-700" />
            <p className="text-sm text-slate-500">
              Loading dashboard data...
            </p>
          </div>
        ) : (
          <>
            {dashboard && (
              <>
                {attentionCount > 0 && (
                  <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <ShieldAlert size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-amber-900">
                        Operational attention required
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        There are {formatNumber(dashboard.overdue_follow_ups)}{" "}
                        overdue follow-ups and{" "}
                        {formatNumber(dashboard.open_escalations)} open
                        escalations requiring review.
                      </p>
                    </div>
                  </section>
                )}

                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-slate-900">
                        Platform metrics
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Current totals reported by the backend
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {metricCards.map((metric) => (
                      <MetricCard key={metric.title} {...metric} />
                    ))}
                  </div>
                </section>
              </>
            )}

            <section className="grid min-w-0 gap-6 xl:grid-cols-2">
              <ChartCard
                title="Follow-up activity"
                description="Created, completed, and missed follow-ups over time"
                action={
                  <select
                    value={trendPeriod}
                    onChange={(event) =>
                      setTrendPeriod(Number(event.target.value) as TrendPeriod)
                    }
                    aria-label="Select follow-up trend period"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-teal-500"
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                  </select>
                }
              >
                {trendError ? (
                  <div className="flex h-72 items-center justify-center rounded-xl bg-red-50 px-5 text-center text-sm text-red-700">
                    {trendError}
                  </div>
                ) : trends.length === 0 ? (
                  <ChartEmptyState message="No follow-up trend data is available for this period." />
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={trendChartData}
                        margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="createdGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#0f766e"
                              stopOpacity={0.22}
                            />
                            <stop
                              offset="95%"
                              stopColor="#0f766e"
                              stopOpacity={0}
                            />
                          </linearGradient>

                          <linearGradient
                            id="completedGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#3b82f6"
                              stopOpacity={0.18}
                            />
                            <stop
                              offset="95%"
                              stopColor="#3b82f6"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          stroke="#e2e8f0"
                          strokeDasharray="4 4"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #e2e8f0",
                            fontSize: 12,
                          }}
                        />

                        <Legend wrapperStyle={{ fontSize: 12 }} />

                        <Area
                          type="monotone"
                          dataKey="created"
                          name="Created"
                          stroke="#0f766e"
                          strokeWidth={2}
                          fill="url(#createdGradient)"
                          activeDot={{ r: 5 }}
                        />

                        <Area
                          type="monotone"
                          dataKey="completed"
                          name="Completed"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#completedGradient)"
                          activeDot={{ r: 5 }}
                        />

                        <Area
                          type="monotone"
                          dataKey="missed"
                          name="Missed"
                          stroke="#dc2626"
                          strokeWidth={2}
                          fill="none"
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </ChartCard>

              <ChartCard
                title="Facility performance"
                description="Patient registrations and overdue follow-ups by facility"
              >
                {facilityError ? (
                  <div className="flex h-72 items-center justify-center rounded-xl bg-red-50 px-5 text-center text-sm text-red-700">
                    {facilityError}
                  </div>
                ) : facilities.length === 0 ? (
                  <ChartEmptyState message="No facility performance data is available." />
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={facilityChartData}
                        margin={{ top: 8, right: 8, left: -18, bottom: 35 }}
                      >
                        <CartesianGrid
                          stroke="#e2e8f0"
                          strokeDasharray="4 4"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="name"
                          angle={-20}
                          textAnchor="end"
                          interval={0}
                          height={55}
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #e2e8f0",
                            fontSize: 12,
                          }}
                        />

                        <Legend wrapperStyle={{ fontSize: 12 }} />

                        <Bar
                          dataKey="patients"
                          name="Patients"
                          fill="#0f766e"
                          radius={[5, 5, 0, 0]}
                        />

                        <Bar
                          dataKey="overdue"
                          name="Overdue follow-ups"
                          fill="#f59e0b"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </ChartCard>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <h2 className="font-bold text-slate-900">
                  Facility performance details
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Facility-level maternal care and follow-up indicators
                </p>
              </div>

              {facilityError ? (
                <p className="p-6 text-sm text-red-700">{facilityError}</p>
              ) : facilities.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
                  <Hospital size={27} className="text-slate-300" />
                  <p className="mt-3 text-sm text-slate-500">
                    No facility records are available.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-slate-50">
                      <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-4">Facility</th>
                        <th className="px-5 py-4">Patients</th>
                        <th className="px-5 py-4">Pregnancies</th>
                        <th className="px-5 py-4">Pending</th>
                        <th className="px-5 py-4">Overdue</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {facilities.map((facility) => (
                        <tr
                          key={facility.facility_id}
                          className="transition hover:bg-slate-50/80"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
                                <Hospital size={17} />
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {facility.facility_name}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {facility.facility_id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                            {formatNumber(facility.total_patients)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {formatNumber(facility.ongoing_pregnancies)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {formatNumber(facility.pending_follow_ups)}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                facility.overdue_follow_ups > 0
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {facility.overdue_follow_ups > 0 ? (
                                <ArrowUpRight size={13} />
                              ) : (
                                <ArrowDownRight size={13} />
                              )}
                              {formatNumber(facility.overdue_follow_ups)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        <footer className="pb-2 text-center text-xs text-slate-400">
          MatriCare AI · Maternal care operations dashboard
        </footer>
      </div>
    </main>
  );
}

export default AdminDashboard;
