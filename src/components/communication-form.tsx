"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Check, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { Field } from "@/components/ui";
import { updateCommsPlan } from "@/lib/actions/communications";

export function CommunicationForm({
  eventId,
  onSuccess,
}: {
  eventId: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await updateCommsPlan(eventId, formData);
      if (res?.error) {
        setError(res.error);
      } else {
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-[16px] border border-[rgba(22,19,17,0.09)] bg-paper p-7">
      <h3 className="font-display text-[1.125rem] font-semibold text-ink mb-6">
        Draft new communication
      </h3>
      
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-[0.875rem] text-red-600 border border-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        <Field label="Subject Line">
          <input
            type="text"
            name="title"
            required
            className="input"
            placeholder="Important Update for All Attendees"
          />
        </Field>

        <div className="grid grid-cols-2 gap-6">
          <Field label="Audience">
            <select name="audience" className="input">
              <option value="all">All Attendees</option>
              <option value="speakers">Speakers Only</option>
              <option value="volunteers">Volunteers Only</option>
              <option value="pending">Pending Registrations</option>
            </select>
          </Field>
          
          <Field label="Status">
            <select name="status" className="input">
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled for later</option>
            </select>
          </Field>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-primary"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Add to plan
          </button>
        </div>
      </div>
    </form>
  );
}
