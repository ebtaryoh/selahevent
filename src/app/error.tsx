"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { SelahMark } from "@/components/logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Caught]:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-parchment px-4 py-16 text-center">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <SelahMark className="h-10 w-10" />
        <span className="font-display text-xl font-semibold text-ink">Selah</span>
      </Link>

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 mb-6">
        <AlertCircle size={32} />
      </div>

      <h1 className="font-display text-3xl font-semibold text-ink">
        Something unexpected happened
      </h1>

      <p className="text-warm-500 text-sm mt-3 max-w-md leading-relaxed">
        We ran into a hiccup loading this screen. Please try again or head back to the main programme.
      </p>

      {error.digest && (
        <div className="mt-4 rounded-lg bg-black/40 border border-white/10 px-3 py-1.5 text-xs font-mono text-warm-400">
          Digest: {error.digest}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="btn btn-brass !py-2.5 !px-5 text-sm flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={15} /> Try again
        </button>

        <Link
          href="/"
          className="btn btn-secondary !py-2.5 !px-5 text-sm flex items-center gap-2"
        >
          <ArrowLeft size={15} /> Return Home
        </Link>
      </div>
    </div>
  );
}
