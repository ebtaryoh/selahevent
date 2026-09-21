"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Mail, KeyRound, RefreshCcw } from "lucide-react";
import { loginOrganization, verifyOrgOTP } from "@/lib/actions";
import Link from "next/link";

type Step = "email" | "otp";

export function LoginForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Step 1: request OTP ─────────────────────────────────────── */
  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await loginOrganization(formData);
      if (result?.step === "otp") {
        setStep("otp");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  /* ── Step 2: verify OTP ──────────────────────────────────────── */
  async function handleOTPSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("email", email);

    try {
      const result = await verifyOrgOTP(formData);
      if (result?.error) {
        setError(result.error);
      }
      // On success the action redirects — nothing more to do here
    } catch (err: any) {
      // Next.js redirect throws — ignore it
      if (!err?.message?.includes("NEXT_REDIRECT")) {
        setError(err.message || "Verification failed. Please try again.");
      }
    } finally {
      setIsPending(false);
    }
  }

  function handleBack() {
    setStep("email");
    setError(null);
  }

  return (
    <div className="space-y-6 max-w-md mx-auto w-full">
      <div className="rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-paper p-6 sm:p-8 shadow-sm">

        {step === "email" ? (
          <>
            {/* Email step */}
            <div className="mb-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brass-wash mb-4">
                <Mail size={22} className="text-brass-deep" />
              </div>
              <h2 className="font-display text-xl font-semibold text-ink">Enter your workspace email</h2>
              <p className="mt-1.5 text-[0.875rem] text-warm-500">
                We'll send a one-time code to verify it's you.
              </p>
            </div>

            <form onSubmit={(e) => { setEmail((e.currentTarget.elements.namedItem("email") as HTMLInputElement).value); handleEmailSubmit(e); }} className="space-y-5">
              {error && (
                <div className="p-3 text-sm text-[var(--color-signal-red)] bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                  Workspace Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="hello@church.com"
                  className="input !w-full"
                  defaultValue={email}
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="btn btn-primary !px-8 !py-3.5 w-full text-[1rem]"
              >
                {isPending ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={18} strokeWidth={2.1} className="ml-2" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* OTP step */}
            <div className="mb-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brass-wash mb-4">
                <KeyRound size={22} className="text-brass-deep" />
              </div>
              <h2 className="font-display text-xl font-semibold text-ink">Check your inbox</h2>
              <p className="mt-1.5 text-[0.875rem] text-warm-500">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-ink">{email}</span>.{" "}
                Enter it below to sign in.
              </p>
              {process.env.NODE_ENV !== "production" && (
                <p className="mt-2 text-xs text-warm-400">
                  Dev mode: check server console, or use <span className="font-mono font-semibold">000000</span> to skip.
                </p>
              )}
            </div>

            <form onSubmit={handleOTPSubmit} className="space-y-5">
              {error && (
                <div className="p-3 text-sm text-[var(--color-signal-red)] bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-ink">
                  Verification Code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  placeholder="000000"
                  className="input !w-full text-center tracking-[0.5em] font-mono text-lg"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="btn btn-primary !px-8 !py-3.5 w-full text-[1rem]"
              >
                {isPending ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Sign In to Workspace
                    <ArrowRight size={18} strokeWidth={2.1} className="ml-2" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="flex items-center justify-center gap-1.5 w-full text-[0.8rem] font-medium text-warm-500 hover:text-ink transition-colors pt-1"
              >
                <RefreshCcw size={13} />
                Use a different email or resend code
              </button>
            </form>
          </>
        )}
      </div>

      <p className="text-center text-[0.875rem] text-warm-500">
        Don't have a workspace?{" "}
        <Link href="/register" className="font-semibold text-brass hover:text-brass-deep transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
}
