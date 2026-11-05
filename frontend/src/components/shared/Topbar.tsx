
import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import Avatar from "../ui/Avatar";
import IconButton from "../ui/IconButton";
import { notificationService } from "../../services/notification.service";

interface TopbarProps {
  onMenuClick?: () => void;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  notificationCount?: number;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
}

function Topbar({
  onMenuClick,
  userName,
  userRole,
  userAvatar,
  notificationCount = 0,
  onLogout,
  onProfileClick,
  onSettingsClick,
  onNotificationsClick,
}: TopbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchError, setSearchError] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isWorkerWorkspace = location.pathname.startsWith("/worker");

  const displayName =
    userName || (isWorkerWorkspace ? "Healthcare Worker" : "Administrator");

  const displayRole =
    userRole ||
    (isWorkerWorkspace ? "Healthcare Worker" : "System Administrator");

  const workspaceLabel = isWorkerWorkspace
    ? "Healthcare Worker Workspace"
    : "Admin Workspace";

  const avatarRole = isWorkerWorkspace
    ? "healthcare-worker"
    : "admin";

  const { data: workerNotifications } = useQuery({
    queryKey: ["worker", "notifications", "unread-count"],
    queryFn: () =>
      notificationService.getMyNotifications({
        page: 1,
        page_size: 1,
      }),
    enabled: isWorkerWorkspace,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const { data: adminNotifications } = useQuery({
    queryKey: ["admin", "notifications", "unread-count"],
    queryFn: () => notificationService.getAdminUnreadCount(),
    enabled: !isWorkerWorkspace,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const unreadCount = isWorkerWorkspace
    ? workerNotifications?.unread_count ?? 0
    : adminNotifications?.unread_count ?? notificationCount;

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setSearchError("");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchValue.trim();

    if (query.length === 1) {
      setSearchError("Enter at least 2 characters.");
      return;
    }

    setSearchError("");

    const workspace = isWorkerWorkspace ? "/worker" : "/admin";
    const params = new URLSearchParams();

    if (query) {
      params.set("search", query);
    }

    const queryString = params.toString();

    navigate(
      `${workspace}/patients${queryString ? `?${queryString}` : ""}`,
    );
  };

  const handleClearSearch = () => {
    setSearchValue("");
    setSearchError("");

    const workspace = isWorkerWorkspace ? "/worker" : "/admin";

    navigate(`${workspace}/patients`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-4 border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <IconButton
          icon={<Menu />}
          label="Open navigation"
          variant="outline"
          className="lg:hidden"
          onClick={onMenuClick}
        />

        <form
          onSubmit={handleSearchSubmit}
          className="relative hidden w-full max-w-[480px] md:block"
          role="search"
        >
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
              setSearchError("");
            }}
            placeholder="Search patients by name or phone..."
            aria-label="Search patients by name or phone"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-24 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
          />

          {searchValue && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="absolute right-[76px] top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={15} />
            </button>
          )}

          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
          >
            Search
          </button>

          {searchError && (
            <p
              role="alert"
              className="absolute left-1 top-full mt-1 text-xs font-medium text-red-600"
            >
              {searchError}
            </p>
          )}
        </form>

        <div className="md:hidden">
          <p className="text-sm font-bold text-slate-900">
            MatriCare <span className="text-brand-500">AI</span>
          </p>
          <p className="text-[10px] text-slate-400">
            {workspaceLabel}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <IconButton
          icon={<Bell />}
          label="Notifications"
          variant="ghost"
          badgeCount={unreadCount}
          onClick={onNotificationsClick}
        />

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((value) => !value)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-slate-50 sm:gap-3"
          >
            <Avatar
              src={userAvatar}
              name={displayName}
              size="md"
              role={avatarRole}
            />

            <div className="hidden text-left sm:block">
              <p className="max-w-[140px] truncate text-xs font-semibold text-slate-800">
                {displayName}
              </p>
              <p className="max-w-[140px] truncate text-[10px] text-slate-400">
                {displayRole}
              </p>
            </div>

            <ChevronDown
              size={15}
              className={[
                "hidden text-slate-400 transition-transform sm:block",
                profileOpen ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-3 w-60 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-900/10 animate-fade-in"
            >
              <div className="border-b border-slate-100 px-3 py-3">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {displayName}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {displayRole}
                </p>
              </div>

              <div className="space-y-1 py-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    onProfileClick?.();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-700"
                >
                  <UserRound size={16} />
                  My Profile
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    onSettingsClick?.();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-700"
                >
                  <Settings size={16} />
                  Account Settings
                </button>
              </div>

              <div className="border-t border-slate-100 pt-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout?.();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
