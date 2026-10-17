"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw, RotateCcw, Home } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    console.error("[Dashboard Error Boundary Caught]:", error);
  }, [error]);

  const handleHardRefresh = () => {
    setIsRetrying(true);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 mb-6 shadow-lg shadow-amber-500/5 animate-pulse">
        <AlertTriangle size={32} />
      </div>

      <div className="eyebrow text-xs text-brass uppercase tracking-wider">
        Workspace Notice
      </div>

      <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-2 max-w-md">
        Temporarily unable to display this workspace
      </h2>

      <p className="text-warm-500 text-sm mt-3 max-w-md leading-relaxed">
        A temporary connection, session, or rendering issue occurred while synchronizing your workspace data. You can reconnect below or return to your main dashboard.
      </p>

      {error?.message && process.env.NODE_ENV === "development" && (
        <div className="mt-3 max-w-lg rounded-md bg-red-950/40 border border-red-500/20 px-3.5 py-2 text-left font-mono text-xs text-red-300">
          {error.message}
        </div>
      )}

      {error?.digest && (
        <div className="mt-3 rounded-lg bg-black/40 border border-white/10 px-3 py-1 text-[0.72rem] font-mono text-warm-400">
          Reference Code: {error.digest}
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            setIsRetrying(true);
            reset();
          }}
          disabled={isRetrying}
          className="btn btn-brass !py-2.5 !px-5 text-sm flex items-center gap-2 cursor-pointer shadow-md"
        >
          <RefreshCw size={15} className={isRetrying ? "animate-spin" : ""} /> Try again
        </button>

        <button
          type="button"
          onClick={handleHardRefresh}
          className="btn btn-secondary !py-2.5 !px-5 text-sm flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw size={15} /> Reload page
        </button>

        <Link
          href="/dashboard"
          className="btn btn-ghost !py-2.5 !px-4 text-sm flex items-center gap-2"
        >
          <Home size={15} /> Dashboard Overview
        </Link>
      </div>
    </div>
  );
}
