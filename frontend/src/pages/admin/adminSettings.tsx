
import {
  Activity,
  Database,
  Globe,
  LockKeyhole,
  Server,
  ShieldCheck,
  Settings,
  Clock,
  Info,
} from "lucide-react";

interface SettingItemProps {
  label: string;
  description: string;
  icon: React.ElementType;
}

function SettingItem({
  label,
  description,
  icon: Icon,
}: SettingItemProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-slate-100 bg-white p-4">
      <div className="rounded-lg bg-teal-50 p-2.5 text-teal-700">
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-800">
          {label}
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
        Server managed
      </span>
    </div>
  );
}

export default function AdminSettings() {
  const settingsGroups = [
    {
      title: "Application",
      description: "Core application configuration.",
      items: [
        {
          label: "Application identity",
          description:
            "Application name and version are configured in the backend environment.",
          icon: Settings,
        },
        {
          label: "Environment",
          description:
            "Development, testing, staging, and production environments are controlled by the backend.",
          icon: Server,
        },
        {
          label: "API configuration",
          description:
            "API versioning and routing are managed by the backend application.",
          icon: Globe,
        },
      ],
    },
    {
      title: "Security and access",
      description: "Authentication and application security configuration.",
      items: [
        {
          label: "Authentication",
          description:
            "JWT authentication and token signing configuration are managed by the backend.",
          icon: LockKeyhole,
        },
        {
          label: "Session expiration",
          description:
            "Access-token expiration is controlled through the backend configuration.",
          icon: Clock,
        },
        {
          label: "Cross-origin access",
          description:
            "Allowed frontend origins are configured through the backend CORS settings.",
          icon: ShieldCheck,
        },
      ],
    },
    {
      title: "Infrastructure",
      description: "Application infrastructure and connectivity.",
      items: [
        {
          label: "Database connection",
          description:
            "Database connection settings are maintained securely in the backend environment.",
          icon: Database,
        },
        {
          label: "Application diagnostics",
          description:
            "Debugging and environment diagnostics are controlled by backend configuration.",
          icon: Activity,
        },
      ],
    },
  ];

  return (
    <div className="min-h-full bg-[#f5f8f8]">
      <div className="mx-auto max-w-6xl space-y-7 p-4 sm:p-6 lg:p-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Admin</span>
            <span>/</span>
            <span className="text-teal-700">Settings</span>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                System Settings
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Review application configuration and infrastructure settings.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">
              <ShieldCheck size={16} />
              Read-only configuration
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <Info className="mt-0.5 shrink-0 text-blue-600" size={19} />
          <div>
            <h2 className="text-sm font-semibold text-blue-900">
              Configuration is managed securely
            </h2>
            <p className="mt-1 text-sm leading-6 text-blue-800">
              System-level settings are maintained through backend environment
              configuration. Sensitive values such as database credentials
              and application secrets are intentionally not displayed here.
            </p>
          </div>
        </div>

        {settingsGroups.map((group) => (
          <section
            key={group.title}
            className="space-y-3"
          >
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {group.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {group.description}
              </p>
            </div>

            <div className="space-y-3">
              {group.items.map((item) => (
                <SettingItem
                  key={item.label}
                  label={item.label}
                  description={item.description}
                  icon={item.icon}
                />
              ))}
            </div>
          </section>
        ))}

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Configuration management
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            To change system configuration, authorized technical
            administrators must update the backend environment and restart
            the application where required. Changes should follow the
            project's deployment and security procedures.
          </p>
        </div>
      </div>
    </div>
  );
}
