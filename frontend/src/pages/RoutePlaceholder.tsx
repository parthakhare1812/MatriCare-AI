
import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

import SectionHeader from "../components/ui/SectionHeader";
import Card from "../components/ui/Card";

function RoutePlaceholder() {
  const location = useLocation();

  const pageName =
    location.pathname.split("/").filter(Boolean).pop() ?? "Dashboard";

  const title = pageName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="MatriCare AI Workspace"
        title={title}
        description="This module is being prepared for integration with the MatriCare AI backend."
      />

      <Card variant="bordered" padding="lg">
        <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Construction size={30} />
          </div>

          <h2 className="text-lg font-semibold text-slate-800">
            Module under development
          </h2>

          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
            The interface for this module will be connected to the
            corresponding FastAPI endpoints. No demonstration records
            or fabricated operational statistics are displayed here.
          </p>

          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
            {location.pathname}
          </p>
        </div>
      </Card>
    </div>
  );
}

export default RoutePlaceholder;
