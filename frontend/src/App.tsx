
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./context/useAuth";
import type { UserRole } from "./types/auth";

import AdminLayout from "./layouts/AdminLayout";
import WorkerLayout from "./layouts/WorkerLayout";

import LoginPage from "./pages/auth/LoginPage";
import NotFound from "./pages/NotFound";

import AdminDashboard from "./pages/admin/adminDashboard";
import AdminPatients from "./pages/admin/adminPatients";
import AdminPregnancies from "./pages/admin/adminpregnancies";
import AdminAntenatalVisits from "./pages/admin/adminAntenatalVisits";
import AdminHealthcareWorkers from "./pages/admin/adminHealthcareWorkers";
import AdminFacilities from "./pages/admin/adminFacilities";
import AdminFollowUpTasks from "./pages/admin/adminFollowUpTasks";
import AdminEscalations from "./pages/admin/adminEscalations";
import AdminNotifications from "./pages/admin/adminNotifications";
import AdminAuditLogs from "./pages/admin/adminAuditLogs";
import AdminSettings from "./pages/admin/adminSettings";
import AdminProfile from "./pages/admin/adminProfile";

import WorkerDashboard from "./pages/worker/workerDashboard";
import WorkerPatients from "./pages/worker/workerPatients";
import WorkerPregnancies from "./pages/worker/workerPregnancies";
import WorkerAntenatalVisits from "./pages/worker/workerAntenatalVisits";
import WorkerFollowUpTasks from "./pages/worker/workerFollowUpTasks";
import WorkerCareSchedule from "./pages/worker/workerCareSchedule";
import WorkerEscalations from "./pages/worker/workerEscalations";
import WorkerNotifications from "./pages/worker/workerNotifications";
import WorkerSettings from "./pages/worker/workerSettings";
import WorkerProfile from "./pages/worker/workerProfile";
interface ProtectedRouteProps {
  allowedRole: UserRole;
}

function getDashboardPath(role: UserRole): string {
  return role === "admin" ? "/admin" : "/worker";
}

function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f8f8]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#087f8c] border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">
            Verifying your session...
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="patients" element={<AdminPatients />} />
            <Route path="pregnancies" element={<AdminPregnancies />} />
            <Route path="antenatal-visits" element={<AdminAntenatalVisits />} />
            <Route path="workers" element={<AdminHealthcareWorkers />} />
            <Route path="facilities" element={<AdminFacilities />} />
            <Route path="follow-ups" element={<AdminFollowUpTasks />} />
            <Route path="escalations" element={<AdminEscalations />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRole="healthcare_worker" />}>
          <Route path="/worker" element={<WorkerLayout />}>
            <Route index element={<WorkerDashboard />} />
            <Route path="patients" element={<WorkerPatients />} />
            <Route path="pregnancies" element={<WorkerPregnancies />} />
            <Route
              path="antenatal-visits"
              element={<WorkerAntenatalVisits />}
            />
            <Route path="follow-ups" element={<WorkerFollowUpTasks />} />
            <Route path="schedule" element={<WorkerCareSchedule />} />
            <Route path="escalations" element={<WorkerEscalations />} />
            <Route path="notifications" element={<WorkerNotifications />} />
            <Route path="settings" element={<WorkerSettings />} />
            <Route path="profile" element={<WorkerProfile />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
