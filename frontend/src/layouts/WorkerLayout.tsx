
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import WorkerSidebar from "../components/shared/WorkerSidebar";
import Topbar from "../components/shared/Topbar";

function WorkerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const displayName = user?.full_name || "Healthcare Worker";
  const displayRole = user?.role
    ? user.role.replaceAll("_", " ")
    : "Healthcare Worker";

  return (
    <div className="min-h-screen bg-canvas">
      <WorkerSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="min-h-screen transition-[padding] duration-300 ease-in-out lg:pl-[280px]">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          userName={displayName}
          userRole={displayRole}
          notificationCount={0}
          onLogout={handleLogout}
          onProfileClick={() => navigate("/worker/profile")}
          onSettingsClick={() => navigate("/worker/settings")}
          onNotificationsClick={() => navigate("/worker/notifications")}
        />

        <main className="min-h-[calc(100vh-76px)]">
          <div className="mc-page-container animate-fade-in">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-slate-200/70 bg-white px-6 py-4 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-2 text-[11px] text-slate-400 sm:flex-row">
            <p>
              © {new Date().getFullYear()} MatriCare AI. All rights reserved.
            </p>

            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Healthcare Worker Workspace</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default WorkerLayout;
