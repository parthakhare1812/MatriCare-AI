
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import Sidebar from "../components/shared/Sidebar";
import Topbar from "../components/shared/Topbar";

function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const displayName = user?.full_name || "Administrator";
  const displayRole = user?.role
    ? user.role.replaceAll("_", " ")
    : "System Administrator";

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onCollapsedChange={setSidebarCollapsed}
      />

      <div
        className={[
          "min-h-screen transition-[padding] duration-300 ease-in-out",
          sidebarCollapsed ? "lg:pl-[88px]" : "lg:pl-[260px]",
        ].join(" ")}
      >
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          userName={displayName}
          userRole={displayRole}
          notificationCount={0}
          onLogout={handleLogout}
          onProfileClick={() => navigate("/admin/profile")}
          onSettingsClick={() => navigate("/admin/settings")}
          onNotificationsClick={() => navigate("/admin/notifications")}
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
              <span>Maternal Care Management Platform</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AdminLayout;
