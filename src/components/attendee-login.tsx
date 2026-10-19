"use client";

import { useState } from "react";
import { requestAttendeeOTP, verifyAttendeeOTP } from "@/lib/attendee";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function AttendeeLogin({ orgId }: { orgId: string }) {
  const [email, setEmail] = useState("");
  const [otpMode, setOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    const res = await requestAttendeeOTP(email, orgId);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setOtpMode(true);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) return;
    setLoading(true);
    setError(null);
    const res = await verifyAttendeeOTP(email, orgId, otpCode);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="max-w-md mx-auto card p-6 sm:p-8">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold text-white">
          Access your wallet
        </h2>
        <p className="mt-2 text-[0.875rem] text-white/60">
          Sign in to view your tickets and manage your registrations.
        </p>
      </div>

      {!otpMode ? (
        <form onSubmit={handleRequestOTP} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[0.795rem] font-medium text-white">
              Email address
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          {error && <p className="text-sm text-[var(--color-signal-red)]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full justify-center"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Continue"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[0.795rem] font-medium text-white">
              Verification Code
            </label>
            <input
              type="text"
              className="input text-center tracking-[0.5em] font-mono text-lg"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              required
            />
            <p className="text-xs text-white/70">
              We sent a 6-digit code to <span className="font-semibold text-white">{email}</span>
            </p>
            <div className="mt-2.5 rounded-xl border border-brass/25 bg-brass/10 p-3 text-[0.78rem] text-brass-light leading-relaxed">
              💡 <strong>Can&apos;t find the email?</strong> Please check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder. Codes arrive within 30 seconds.
            </div>
          </div>
          {error && <p className="text-sm text-[var(--color-signal-red)]">{error}</p>}
          <button
            type="submit"
            disabled={loading || otpCode.length < 6}
            className="btn btn-primary w-full justify-center"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify Code"}
          </button>
          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              disabled={loading}
              className="font-medium text-white/60 hover:text-white transition-colors"
              onClick={handleRequestOTP}
            >
              Resend code
            </button>
            <button
              type="button"
              className="font-medium text-[var(--color-brass)] hover:underline"
              onClick={() => {
                setOtpMode(false);
                setOtpCode("");
              }}
            >
              Use a different email
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
