import { NavLink } from "react-router-dom";
import {
  Activity,
  Baby,
  Bell,
  CalendarCheck,
  ClipboardCheck,
  HeartPulse,
  LayoutDashboard,
  Stethoscope,
  Users,
  X,
} from "lucide-react";

interface WorkerSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

const navigationGroups = [
  {
    title: "MY WORKSPACE",
    items: [
      {
        label: "My Dashboard",
        path: "/worker",
        icon: LayoutDashboard,
      },
      {
        label: "My Patients",
        path: "/worker/patients",
        icon: Users,
      },
    ],
  },
  {
    title: "MATERNAL CARE",
    items: [
      {
        label: "Pregnancy Management",
        path: "/worker/pregnancies",
        icon: Baby,
      },
      {
        label: "Antenatal Visits",
        path: "/worker/antenatal-visits",
        icon: HeartPulse,
      },
      {
        label: "Follow-up Tasks",
        path: "/worker/follow-ups",
        icon: ClipboardCheck,
      },
      {
        label: "Care Schedule",
        path: "/worker/schedule",
        icon: CalendarCheck,
      },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [
      {
        label: "Escalations",
        path: "/worker/escalations",
        icon: Activity,
      },
      {
        label: "Notifications",
        path: "/worker/notifications",
        icon: Bell,
      },
    ],
  },
];

function WorkerSidebar({
  mobileOpen = false,
  onClose,
}: WorkerSidebarProps) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 cursor-default bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col",
          "border-r border-slate-200/70 bg-white",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-500/20">
            <HeartPulse size={22} strokeWidth={2.2} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-[17px] font-bold tracking-tight text-slate-900">
              MatriCare<span className="text-brand-500"> AI</span>
            </h1>
            <p className="text-[10px] font-medium tracking-[0.12em] text-slate-400">
              MATERNAL CARE PLATFORM
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <nav aria-label="Healthcare worker navigation" className="space-y-7">
            {navigationGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.13em] text-slate-400">
                  {group.title}
                </p>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === "/worker"}
                        onClick={onClose}
                        className={({ isActive }) =>
                          [
                            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5",
                            "text-[13px] font-medium transition-all duration-200",
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

                            <span className="flex-1 truncate">
                              {item.label}
                            </span>
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

        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className="rounded-xl bg-brand-50/70 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600">
                <Stethoscope size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800">
                  Care Workspace
                </p>
                <p className="text-[10px] text-slate-500">
                  Healthcare operations
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default WorkerSidebar;