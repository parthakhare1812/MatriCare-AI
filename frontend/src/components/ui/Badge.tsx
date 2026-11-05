
import type { HTMLAttributes, ReactNode } from "react";
import {
  CheckCircle2,
  Clock3,
  AlertTriangle,
  AlertCircle,
  Activity,
  XCircle,
} from "lucide-react";

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "brand";

type BadgeSize = "sm" | "md" | "lg";

type BadgeStatus =
  | "pending"
  | "completed"
  | "overdue"
  | "escalated"
  | "high-risk"
  | "active"
  | "inactive"
  | "in-progress";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  status?: BadgeStatus;
  label?: string;
  icon?: ReactNode;
  showDot?: boolean;
  children?: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/15",
  danger: "bg-rose-50 text-rose-700 ring-rose-600/15",
  info: "bg-blue-50 text-blue-700 ring-blue-600/15",
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/10",
  brand: "bg-brand-50 text-brand-700 ring-brand-600/15",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

const statusConfig: Record<
  BadgeStatus,
  { variant: BadgeVariant; label: string; icon: ReactNode }
> = {
  pending: {
    variant: "warning",
    label: "Pending",
    icon: <Clock3 />,
  },
  completed: {
    variant: "success",
    label: "Completed",
    icon: <CheckCircle2 />,
  },
  overdue: {
    variant: "danger",
    label: "Overdue",
    icon: <AlertCircle />,
  },
  escalated: {
    variant: "danger",
    label: "Escalated",
    icon: <AlertTriangle />,
  },
  "high-risk": {
    variant: "danger",
    label: "High Risk",
    icon: <AlertTriangle />,
  },
  active: {
    variant: "success",
    label: "Active",
    icon: <Activity />,
  },
  inactive: {
    variant: "neutral",
    label: "Inactive",
    icon: <XCircle />,
  },
  "in-progress": {
    variant: "info",
    label: "In Progress",
    icon: <Clock3 />,
  },
};

const Badge = ({
  variant,
  size = "md",
  status,
  label,
  icon,
  showDot = false,
  children,
  className = "",
  ...props
}: BadgeProps) => {
  const config = status ? statusConfig[status] : undefined;

  const resolvedVariant = variant ?? config?.variant ?? "neutral";
  const resolvedLabel = label ?? children ?? config?.label ?? "Unknown";
  const resolvedIcon = icon ?? config?.icon;

  return (
    <span
      className={[
        "inline-flex w-fit items-center gap-1.5 rounded-full font-semibold",
        "ring-1 ring-inset whitespace-nowrap",
        variantStyles[resolvedVariant],
        sizeStyles[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {showDot && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
          aria-hidden="true"
        />
      )}

      {!showDot && resolvedIcon && (
        <span
          className="[&>svg]:h-3.5 [&>svg]:w-3.5"
          aria-hidden="true"
        >
          {resolvedIcon}
        </span>
      )}

      {resolvedLabel}
    </span>
  );
};

export default Badge;
