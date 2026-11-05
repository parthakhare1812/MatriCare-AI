
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Loader2 } from "lucide-react";

type IconButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline";

type IconButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  badge?: boolean;
  badgeCount?: number;
}

const variantStyles: Record<IconButtonVariant, string> = {
  default:
    "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900",

  primary:
    "bg-brand-500 text-white shadow-sm hover:bg-brand-600",

  secondary:
    "bg-brand-50 text-brand-700 hover:bg-brand-100",

  ghost:
    "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800",

  danger:
    "bg-rose-50 text-rose-600 hover:bg-rose-100",

  outline:
    "border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700",
};

const sizeStyles: Record<IconButtonSize, string> = {
  xs: "h-7 w-7 [&>svg]:h-3.5 [&>svg]:w-3.5",
  sm: "h-9 w-9 [&>svg]:h-4 [&>svg]:w-4",
  md: "h-10 w-10 [&>svg]:h-[18px] [&>svg]:w-[18px]",
  lg: "h-12 w-12 [&>svg]:h-5 [&>svg]:w-5",
  xl: "h-14 w-14 [&>svg]:h-6 [&>svg]:w-6",
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      variant = "ghost",
      size = "md",
      loading = false,
      badge = false,
      badgeCount,
      disabled,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    const hasBadge = badge || (badgeCount !== undefined && badgeCount > 0);

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-label={label}
        aria-busy={loading}
        title={label}
        className={[
          "relative inline-flex shrink-0 items-center justify-center",
          "rounded-xl transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-4",
          "focus-visible:ring-brand-500/15",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-95",
          variantStyles[variant],
          sizeStyles[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          icon
        )}

        {hasBadge && (
          <span
            aria-hidden="true"
            className={[
              "absolute right-1 top-1 flex items-center justify-center",
              "min-h-2 min-w-2 rounded-full bg-rose-500",
              badgeCount !== undefined
                ? "h-4 min-w-4 px-1 text-[9px] font-bold text-white"
                : "h-2.5 w-2.5 border-2 border-white",
            ].join(" ")}
          >
            {badgeCount !== undefined &&
              (badgeCount > 99 ? "99+" : badgeCount)}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export default IconButton;
