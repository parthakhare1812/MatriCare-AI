
import type { HTMLAttributes } from "react";
import {
  UserRound,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

type AvatarRole =
  | "admin"
  | "healthcare-worker"
  | "supervisor";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  role?: AvatarRole;
  online?: boolean;
  showStatus?: boolean;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-16 w-16 text-lg",
  "2xl": "h-20 w-20 text-xl",
};

const statusSizeStyles: Record<AvatarSize, string> = {
  xs: "h-2 w-2",
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
  xl: "h-4 w-4",
  "2xl": "h-4.5 w-4.5",
};

const roleStyles: Record<AvatarRole, string> = {
  admin: "bg-violet-100 text-violet-700",
  "healthcare-worker": "bg-brand-50 text-brand-700",
  supervisor: "bg-blue-100 text-blue-700",
};

const roleIcons = {
  admin: ShieldCheck,
  "healthcare-worker": Stethoscope,
  supervisor: UserRound,
};

function getInitials(name?: string): string {
  if (!name?.trim()) return "MC";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function Avatar({
  src,
  name,
  size = "md",
  role,
  online,
  showStatus = false,
  className = "",
  ...props
}: AvatarProps) {
  const initials = getInitials(name);
  const RoleIcon = role ? roleIcons[role] : null;

  return (
    <div
      className={[
        "relative inline-flex shrink-0 items-center justify-center",
        sizeStyles[size],
        role ? roleStyles[role] : "bg-slate-100 text-slate-600",
        "overflow-hidden rounded-full font-semibold",
        "ring-2 ring-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="img"
      aria-label={name ? `Profile of ${name}` : "User profile"}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : role && RoleIcon ? (
        <RoleIcon className="h-1/2 w-1/2" aria-hidden="true" />
      ) : (
        initials
      )}

      {showStatus && (
        <span
          className={[
            "absolute bottom-0 right-0 rounded-full",
            "border-2 border-white",
            statusSizeStyles[size],
            online ? "bg-emerald-500" : "bg-slate-400",
          ].join(" ")}
          aria-label={online ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}

export default Avatar;
