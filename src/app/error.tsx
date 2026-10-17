"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw, RotateCcw, Home } from "lucide-react";
import { SelahMark } from "@/components/logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    console.error("[Global Error Caught]:", error);
  }, [error]);

  const handleHardRefresh = () => {
    setIsRetrying(true);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-parchment px-4 py-16 text-center">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <SelahMark className="h-10 w-10" />
        <span className="font-display text-xl font-semibold text-ink">Selah</span>
      </Link>

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 mb-6 shadow-lg shadow-red-500/5">
        <AlertCircle size={32} />
      </div>

      <h1 className="font-display text-3xl font-semibold text-ink">
        Temporarily unable to load this page
      </h1>

      <p className="text-warm-500 text-sm mt-3 max-w-md leading-relaxed">
        A temporary network or rendering hiccup occurred. You can reload the page to reconnect or return to the main homepage.
      </p>

      {error?.message && process.env.NODE_ENV === "development" && (
        <div className="mt-4 max-w-lg rounded-md bg-red-950/40 border border-red-500/20 px-4 py-2.5 text-left font-mono text-xs text-red-300">
          {error.message}
        </div>
      )}

      {error?.digest && (
        <div className="mt-4 rounded-lg bg-black/40 border border-white/10 px-3 py-1.5 text-xs font-mono text-warm-400">
          Reference Code: {error.digest}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
          href="/"
          className="btn btn-ghost !py-2.5 !px-4 text-sm flex items-center gap-2"
        >
          <Home size={15} /> Return Home
        </Link>
      </div>
    </div>
  );
}
