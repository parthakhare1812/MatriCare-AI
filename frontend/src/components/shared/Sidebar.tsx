
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  Baby,
  Bell,
  Building2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

interface NavigationItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const navigationGroups: NavigationGroup[] = [
  {
    title: "WORKSPACE",
    items: [
      {
        label: "Overview",
        path: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "MATERNAL CARE",
    items: [
      {
        label: "Patients",
        path: "/admin/patients",
        icon: Users,
      },
      {
        label: "Pregnancies",
        path: "/admin/pregnancies",
        icon: Baby,
      },
      {
        label: "Antenatal Visits",
        path: "/admin/antenatal-visits",
        icon: HeartPulse,
      },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      {
        label: "Healthcare Workers",
        path: "/admin/workers",
        icon: ShieldCheck,
      },
      {
        label: "Facilities",
        path: "/admin/facilities",
        icon: Building2,
      },
      {
        label: "Follow-up Tasks",
        path: "/admin/follow-ups",
        icon: ClipboardCheck,
      },
      {
        label: "Escalations",
        path: "/admin/escalations",
        icon: Activity,
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        label: "Notifications",
        path: "/admin/notifications",
        icon: Bell,
      },
      {
        label: "Audit Logs",
        path: "/admin/audit-logs",
        icon: ClipboardList,
      },
      {
        label: "Settings",
        path: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

function Sidebar({
  mobileOpen = false,
  onClose,
  onCollapsedChange,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapse = () => {
    setCollapsed((previous) => {
      const next = !previous;
      onCollapsedChange?.(next);
      return next;
    });
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 cursor-default bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        aria-label="Admin sidebar"
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col",
          "border-r border-slate-200/70 bg-white",
          "transition-all duration-300 ease-in-out",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-[88px]" : "lg:w-[260px]",
          "w-[280px]",
        ].join(" ")}
      >
        {/* Brand */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-500/20">
              <HeartPulse size={22} strokeWidth={2.2} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <h1 className="truncate text-[17px] font-bold tracking-tight text-slate-900">
                  MatriCare
                  <span className="text-brand-500"> AI</span>
                </h1>

                <p className="text-[10px] font-medium tracking-[0.12em] text-slate-400">
                  MATERNAL CARE PLATFORM
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <nav aria-label="Admin navigation" className="space-y-7">
            {navigationGroups.map((group) => (
              <div key={group.title}>
                {!collapsed && (
                  <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.13em] text-slate-400">
                    {group.title}
                  </p>
                )}

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === "/admin"}
                        onClick={onClose}
                        title={collapsed ? item.label : undefined}
                        aria-label={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          [
                            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5",
                            "text-[13px] font-medium transition-all duration-200",
                            collapsed ? "justify-center" : "",
                            isActive
                              ? "bg-brand-50 text-brand-700"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                          ].join(" ")
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-brand-500" />
                            )}

                            <Icon
                              size={19}
                              strokeWidth={isActive ? 2.2 : 1.8}
                              className="shrink-0"
                              aria-hidden="true"
                            />

                            {!collapsed && (
                              <span className="flex-1 truncate">
                                {item.label}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Workspace information and collapse control */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className="mb-3 rounded-xl bg-brand-50/70 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600">
                <ShieldCheck size={17} />
              </div>

              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800">
                    Admin Workspace
                  </p>

                  <p className="text-[10px] text-slate-500">
                    System management
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="hidden w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:flex"
          >
            {collapsed ? (
              <Menu size={17} />
            ) : (
              <>
                <ChevronDown size={15} className="rotate-90" />
                Collapse sidebar
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
