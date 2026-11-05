
import type { ReactNode } from "react";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  eyebrow?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

function SectionHeader({
  title,
  description,
  breadcrumbs = [],
  eyebrow,
  action,
  secondaryAction,
  className = "",
}: SectionHeaderProps) {
  return (
    <section
      className={`flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <div className="min-w-0 space-y-3">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <li className="flex items-center">
                <Home size={13} aria-hidden="true" />
              </li>

              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <li
                    key={`${item.label}-${index}`}
                    className="flex items-center gap-2"
                  >
                    <ChevronRight
                      size={13}
                      className="text-slate-300"
                      aria-hidden="true"
                    />

                    {item.href && !isLast ? (
                      <a
                        href={item.href}
                        className="transition-colors hover:text-brand-600"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span
                        className={
                          isLast
                            ? "font-medium text-slate-600"
                            : ""
                        }
                        aria-current={isLast ? "page" : undefined}
                      >
                        {item.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        <div>
          {eyebrow && (
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
              {eyebrow}
            </p>
          )}

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            {title}
          </h1>

          {description && (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {(action || secondaryAction) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {secondaryAction}
          {action}
        </div>
      )}
    </section>
  );
}

export default SectionHeader;
