
import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type CardVariant = "default" | "bordered" | "elevated" | "interactive";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    "border border-slate-100 bg-white shadow-sm",

  bordered:
    "border border-slate-200 bg-white shadow-none",

  elevated:
    "border border-slate-100 bg-white shadow-[0_8px_30px_rgb(30,55,65,0.07)]",

  interactive:
    "border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg",
};

const paddingStyles = {
  none: "p-0",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      padding = "md",
      children,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={[
          "rounded-2xl",
          variantStyles[variant],
          paddingStyles[padding],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({
  title,
  description,
  action,
  className = "",
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${className}`}
      {...props}
    >
      <div className="min-w-0">
        <h3 className="text-sm font-semibold tracking-tight text-slate-800">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({
  children,
  className = "",
  ...props
}: CardContentProps) {
  return (
    <div className={`mt-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;
