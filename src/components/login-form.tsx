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

            <div className="mb-6">
              <a 
                href="/api/auth/google"
                className="btn !bg-white !text-ink !border-[rgba(22,19,17,0.15)] hover:!bg-warm-50 !w-full !px-8 !py-3.5 text-[1rem] flex items-center justify-center gap-3"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  <path d="M1 1h22v22H1z" fill="none"/>
                </svg>
                Sign in with Google
              </a>
              
              <div className="mt-6 flex items-center justify-center text-sm text-warm-400">
                <span className="h-px bg-[rgba(22,19,17,0.08)] flex-1"></span>
                <span className="px-3">or continue with email</span>
                <span className="h-px bg-[rgba(22,19,17,0.08)] flex-1"></span>
              </div>
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
