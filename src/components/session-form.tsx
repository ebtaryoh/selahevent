"use client";

import { useState } from "react";
import { ArrowLeft, Check, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { Field } from "@/components/ui";
import {
  createSession,
  updateSession,
  deleteSession,
} from "@/lib/actions/sessions";
import { useRouter } from "next/navigation";

function toDatetimeLocal(dateString?: string | Date | null) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SessionForm({
  eventId,
  session,
}: {
  eventId: string;
  session?: any;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isEditing = !!session;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    let res;
    if (isEditing) {
      res = await updateSession(session.id, eventId, formData);
    } else {
      res = await createSession(eventId, formData);
    }

    if (res?.error) {
      setError(res.error);
      setSubmitting(false);
    } else {
      router.push(`/dashboard/events/${eventId}/schedule`);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    setDeleting(true);
    const res = await deleteSession(session.id, eventId);
    if (res?.error) {
      setError(res.error);
      setDeleting(false);
    } else {
      router.push(`/dashboard/events/${eventId}/schedule`);
    }
  };

  return (
    <div className="max-w-2xl">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/events/${eventId}/schedule`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.11)] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
          >
            <ArrowLeft size={16} className="text-ink" />
          </Link>
          <h1 className="font-display text-[1.75rem] font-semibold text-ink">
            {isEditing ? "Edit Session" : "New Session"}
          </h1>
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || submitting}
            className="btn btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {deleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            <span className="ml-2">Delete</span>
          </button>
        )}
      </header>

      {error && (
        <div className="mb-8 rounded-[12px] bg-red-50 p-4 text-[0.875rem] text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-[16px] border border-[rgba(255,255,255,0.09)] bg-paper p-7">
          <h3 className="mb-6 font-display text-[1.125rem] font-semibold text-ink">
            Basic Information
          </h3>
          <div className="grid gap-6">
            <Field label="Session Title">
              <input className="input" name="title" defaultValue={session?.title} placeholder="e.g. Morning Worship" required />
            </Field>
            <Field label="Description">
              <input className="input" name="description" defaultValue={session?.description} placeholder="Brief description of what will happen in this session..." />
            </Field>
            <div className="grid grid-cols-2 gap-6">
              <Field label="Day">
                <input className="input" name="day" type="number" min="1" defaultValue={session?.day ?? 1} required />
              </Field>
              <Field label="Track">
                <input className="input" name="track" defaultValue={session?.track ?? "Main"} placeholder="e.g. Main, Breakout A" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Field label="Starts At">
                <input className="input" name="startsAt" type="datetime-local" defaultValue={toDatetimeLocal(session?.startsAt)} required />
              </Field>
              <Field label="Ends At">
                <input className="input" name="endsAt" type="datetime-local" defaultValue={toDatetimeLocal(session?.endsAt)} required />
              </Field>
            </div>
          </div>
        </div>

        <div className="rounded-[16px] border border-[rgba(255,255,255,0.09)] bg-paper p-7">
          <h3 className="mb-6 font-display text-[1.125rem] font-semibold text-ink">
            Details
          </h3>
          <div className="grid gap-6">
            <Field label="Speaker Name (Optional)">
              <input className="input" name="speakerName" defaultValue={session?.speakerName} placeholder="e.g. John Doe" />
            </Field>
            <Field label="Venue">
              <input className="input" name="venue" defaultValue={session?.venue ?? "Main Hall"} placeholder="e.g. Main Hall, Room 101" />
            </Field>
            <div>
              <label className="mb-2 block text-[0.8125rem] font-medium text-ink">
                Session Type
              </label>
              <select
                name="kind"
                defaultValue={session?.kind ?? "session"}
                className="w-full rounded-[10px] border border-[rgba(255,255,255,0.14)] bg-transparent px-4 py-2.5 text-[0.9375rem] text-ink outline-none transition-all placeholder:text-[rgba(255,255,255,0.35)] focus:border-brass-light focus:ring-4 focus:ring-brass-light/15"
              >
                <option value="session">Session</option>
                <option value="keynote">Keynote</option>
                <option value="workshop">Workshop</option>
                <option value="break">Break / Lunch</option>
                <option value="networking">Networking</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={submitting || deleting}
            className="btn btn-primary"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            <span className="ml-2">
              {isEditing ? "Save changes" : "Create session"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
