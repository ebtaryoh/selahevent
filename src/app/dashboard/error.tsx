"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error Boundary Caught]:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 mb-6 shadow-lg shadow-amber-500/5">
        <AlertTriangle size={32} />
      </div>

      <div className="eyebrow text-xs text-brass uppercase tracking-wider">
        Operational Notice
      </div>

      <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-2 max-w-md">
        Unable to load dashboard workspace
      </h2>

      <p className="text-warm-500 text-sm mt-3 max-w-md leading-relaxed">
        We encountered an unexpected issue while retrieving this event&apos;s live data. You can attempt to refresh the connection or return to your overview.
      </p>

      {error.digest && (
        <div className="mt-4 rounded-lg bg-black/30 border border-white/10 px-3 py-1.5 text-[0.75rem] font-mono text-warm-400">
          Ref ID: {error.digest}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="btn btn-brass !py-2.5 !px-5 text-sm flex items-center gap-2 cursor-pointer shadow-md"
        >
          <RefreshCw size={15} /> Try again
        </button>

        <Link
          href="/dashboard"
          className="btn btn-secondary !py-2.5 !px-5 text-sm flex items-center gap-2"
        >
          <ArrowLeft size={15} /> Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
