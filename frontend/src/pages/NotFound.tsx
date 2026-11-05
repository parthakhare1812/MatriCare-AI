
import { Link } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";

import Button from "../components/ui/Button";

function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-600">
          <SearchX size={38} />
        </div>

        <p className="text-sm font-bold tracking-widest text-brand-600">
          ERROR 404
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Page not found
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          The page you're looking for doesn't exist or may have
          been moved.
        </p>

        <Link to="/" className="mt-7 inline-flex">
          <Button leftIcon={<ArrowLeft size={16} />}>
            Return to Home
          </Button>
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
