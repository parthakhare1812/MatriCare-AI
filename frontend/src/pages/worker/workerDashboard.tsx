
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  HeartPulse,
  RefreshCw,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { workerDashboardService } from "../../services/workerDashboard.service";

import type {
  WorkerDashboard,
  WorkerFollowUpTrend,
} from "../../types/workerDashboard";

interface MetricCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  iconStyle: string;
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconStyle,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
            {value.toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            {description}
          </p>
        </div>

        <div className={`shrink-0 rounded-xl p-3 ${iconStyle}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return value;

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default function WorkerDashboard() {
  const [dashboard, setDashboard] = useState<WorkerDashboard | null>(null);
  const [trends, setTrends] = useState<WorkerFollowUpTrend[]>([]);

  const [days, setDays] = useState(7);
  const [refreshKey, setRefreshKey] = useState(0);

  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);

  const [dashboardError, setDashboardError] = useState("");
  const [trendError, setTrendError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(async () => {
      setDashboardLoading(true);
      setTrendLoading(true);
      setDashboardError("");
      setTrendError("");

      const [dashboardResult, trendResult] = await Promise.allSettled([
        workerDashboardService.getDashboard(),
        workerDashboardService.getFollowUpTrends(days),
      ]);

      if (cancelled) return;

      if (dashboardResult.status === "fulfilled") {
        setDashboard(dashboardResult.value);
      } else {
        setDashboardError(
          "Unable to load dashboard statistics. Please try again.",
        );
      }

      if (trendResult.status === "fulfilled") {
        setTrends(trendResult.value.trends);
      } else {
        setTrendError(
          "Unable to load follow-up trends. Please try again.",
        );
      }

      setDashboardLoading(false);
      setTrendLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [days, refreshKey]);

  const metrics = useMemo(() => {
    if (!dashboard) return [];

    return [
      {
        title: "Total Patients",
        value: dashboard.total_patients,
        description: "Active patients across assigned facilities",
        icon: Users,
        iconStyle: "bg-blue-50 text-blue-700",
      },
      {
        title: "Ongoing Pregnancies",
        value: dashboard.ongoing_pregnancies,
        description: "Currently ongoing pregnancy records",
        icon: HeartPulse,
        iconStyle: "bg-rose-50 text-rose-700",
      },
      {
        title: "Antenatal Visits",
        value: dashboard.total_antenatal_visits,
        description: "Total recorded antenatal visits",
        icon: CalendarClock,
        iconStyle: "bg-violet-50 text-violet-700",
      },
      {
        title: "Pending Follow-ups",
        value: dashboard.pending_follow_ups,
        description: "Follow-up tasks with pending status",
        icon: Clock3,
        iconStyle: "bg-amber-50 text-amber-700",
      },
      {
        title: "Upcoming Follow-ups",
        value: dashboard.upcoming_follow_ups,
        description: "Pending tasks due within the next three days",
        icon: CalendarClock,
        iconStyle: "bg-cyan-50 text-cyan-700",
      },
      {
        title: "Overdue Follow-ups",
        value: dashboard.overdue_follow_ups,
        description: "Follow-up tasks marked as missed",
        icon: AlertCircle,
        iconStyle: "bg-red-50 text-red-700",
      },
      {
        title: "Unread Notifications",
        value: dashboard.unread_notifications,
        description: "Unread notifications for your account",
        icon: Bell,
        iconStyle: "bg-indigo-50 text-indigo-700",
      },
      {
        title: "Open Escalations",
        value: dashboard.open_escalations,
        description: "Escalations currently marked as open",
        icon: ShieldAlert,
        iconStyle: "bg-orange-50 text-orange-700",
      },
    ];
  }, [dashboard]);

  const chartData = useMemo(
    () =>
      trends.map((trend) => ({
        ...trend,
        displayDate: formatDate(trend.date),
      })),
    [trends],
  );

  const handleRefresh = () => {
    setRefreshKey((current) => current + 1);
  };

  return (
    <div className="min-h-full bg-[#f5f8f8]">
      <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Healthcare Worker</span>
                <span>/</span>
                <span className="text-teal-700">Dashboard</span>
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                Dashboard Overview
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Monitor maternal care activities and follow-up operations across your assigned facilities.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={dashboardLoading || trendLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={
                  dashboardLoading || trendLoading ? "animate-spin" : ""
                }
              />
              Refresh
            </button>
          </div>
        </div>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Operational Overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Live statistics from your assigned facilities.
              </p>
            </div>
            <Activity size={20} className="text-teal-700" />
          </div>

          {dashboardError && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} />
              <span className="flex-1">{dashboardError}</span>
              <button
                type="button"
                onClick={handleRefresh}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {dashboardLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-xl border border-slate-100 bg-white"
                />
              ))}
            </div>
          ) : dashboardError ? null : dashboard ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard
                  key={metric.title}
                  title={metric.title}
                  value={metric.value}
                  description={metric.description}
                  icon={metric.icon}
                  iconStyle={metric.iconStyle}
                />
              ))}
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Follow-up Activity
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Daily follow-up task creation, completion and missed activity.
              </p>
            </div>

            <div className="flex w-fit items-center gap-1 rounded-lg bg-slate-100 p-1">
              {[7, 30, 90].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDays(option)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    days === option
                      ? "bg-white text-teal-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {option} days
                </button>
              ))}
            </div>
          </div>

          {trendError && (
            <div className="m-5 flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} />
              <span className="flex-1">{trendError}</span>
              <button
                type="button"
                onClick={handleRefresh}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {trendLoading ? (
            <div className="flex h-80 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
                <p className="text-sm text-slate-500">
                  Loading follow-up activity...
                </p>
              </div>
            </div>
          ) : trendError ? null : chartData.length === 0 ? (
            <div className="flex h-72 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <Activity size={25} className="text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                No follow-up activity available
              </h3>
              <p className="max-w-md text-sm text-slate-500">
                No trend records are available for your assigned facilities in this period.
              </p>
            </div>
          ) : (
            <div className="p-4 pt-6 sm:p-6">
              <div className="mb-5 flex flex-wrap gap-5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                  Created
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  Completed
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Missed
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{
                      top: 10,
                      right: 12,
                      left: -18,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="workerCreatedGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#0d9488"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#0d9488"
                          stopOpacity={0}
                        />
                      </linearGradient>

                      <linearGradient
                        id="workerCompletedGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#2563eb"
                          stopOpacity={0.16}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2563eb"
                          stopOpacity={0}
                        />
                      </linearGradient>

                      <linearGradient
                        id="workerMissedGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#ef4444"
                          stopOpacity={0.14}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ef4444"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e9eeee"
                    />

                    <XAxis
                      dataKey="displayDate"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      minTickGap={24}
                    />

                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                    />

                    <Tooltip
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.date
                          ? formatDate(payload[0].payload.date)
                          : ""
                      }
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="created"
                      name="Created"
                      stroke="#0d9488"
                      strokeWidth={2}
                      fill="url(#workerCreatedGradient)"
                    />

                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fill="url(#workerCompletedGradient)"
                    />

                    <Area
                      type="monotone"
                      dataKey="missed"
                      name="Missed"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#workerMissedGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Showing {days} calendar days of follow-up activity.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0 text-blue-700"
            />
            <div>
              <h2 className="text-sm font-semibold text-blue-900">
                Worker dashboard data scope
              </h2>
              <p className="mt-1 text-sm leading-6 text-blue-800">
                Dashboard statistics are retrieved for the authenticated healthcare worker and the worker's active facility assignments. Notification counts are specific to the authenticated account.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
