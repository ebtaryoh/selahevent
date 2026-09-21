"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Check, Loader2, Award, Info } from "lucide-react";
import Link from "next/link";
import { Field } from "@/components/ui";
import { updateCertificateSettings } from "@/lib/actions/certificates";

export function CertificateForm({
  eventId,
  initialThreshold,
}: {
  eventId: string;
  initialThreshold: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await updateCertificateSettings(eventId, formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[42rem]">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/events/${eventId}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(22,19,17,0.11)] transition-colors hover:bg-[rgba(22,19,17,0.04)]"
          >
            <ArrowLeft size={16} className="text-ink" />
          </Link>
          <h1 className="font-display text-[1.75rem] font-semibold text-ink">
            Certificates
          </h1>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary"
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : success ? (
            <Check size={16} className="text-green-400" />
          ) : (
            <Check size={16} />
          )}
          {success ? "Saved" : "Save settings"}
        </button>
      </header>

      {error && (
        <div className="mb-8 rounded-xl bg-red-50 p-4 text-[0.875rem] text-red-600 border border-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-8 rounded-[16px] border border-[rgba(22,19,17,0.09)] bg-paper p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brass/10 text-[var(--color-brass-deep)]">
            <Award size={24} />
          </div>
          <div>
            <h2 className="font-display text-[1.25rem] font-medium text-ink">
              Certificate Settings
            </h2>
            <p className="text-sm text-warm-500">
              Configure criteria for attendees to receive automated certificates of participation.
            </p>
          </div>
        </div>

        <div className="mt-2 border-t border-[rgba(22,19,17,0.09)] pt-8">
          <Field
            label="Attendance Threshold (%)"
            description="Minimum percentage of sessions an attendee must check into to qualify. Set to 0 to disable certificates."
          >
            <div className="relative w-48">
              <input
                type="number"
                name="certificateThreshold"
                min="0"
                max="100"
                defaultValue={initialThreshold}
                className="input pr-8"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-500">
                %
              </span>
            </div>
          </Field>
          
          <div className="mt-8 flex gap-3 rounded-lg bg-[rgba(22,19,17,0.03)] p-4 text-[0.875rem] text-warm-600">
            <Info size={16} className="mt-0.5 shrink-0 text-warm-400" />
            <p>
              When an attendee checks out of the final session, the system calculates their total attendance time against the event duration. If they meet the threshold, a PDF certificate is emailed to them automatically.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
