"use client";

import { useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { Field } from "@/components/ui";
import {
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
} from "@/lib/actions/speakers";
import { useRouter } from "next/navigation";

export function SpeakerForm({
  eventId,
  speaker,
}: {
  eventId: string;
  speaker?: any;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isEditing = !!speaker;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    let res;
    if (isEditing) {
      res = await updateSpeaker(speaker.id, eventId, formData);
    } else {
      res = await createSpeaker(eventId, formData);
    }

    if (res?.error) {
      setError(res.error);
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to remove this speaker?")) {
      setDeleting(true);
      const res = await deleteSpeaker(speaker.id, eventId);
      if (res?.error) {
        setError(res.error);
        setDeleting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[42rem]">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/events/${eventId}/speakers`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(22,19,17,0.11)] transition-colors hover:bg-[rgba(22,19,17,0.04)]"
          >
            <ArrowLeft size={16} className="text-ink" />
          </Link>
          <h1 className="font-display text-[1.75rem] font-semibold text-ink">
            {isEditing ? "Edit Speaker" : "Add Speaker"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="btn btn-ghost text-red-600 hover:bg-red-50"
            >
              {deleting ? "Removing..." : "Remove speaker"}
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            Save profile
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-8 rounded-xl bg-red-50 p-4 text-[0.875rem] text-red-600 border border-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-8 rounded-[16px] border border-[rgba(22,19,17,0.09)] bg-paper p-7">
        <h2 className="font-display text-[1.25rem] font-medium text-ink">
          Speaker Details
        </h2>

        <div className="grid gap-6">
          <Field label="Full name">
            <input
              type="text"
              name="name"
              required
              defaultValue={speaker?.name}
              className="input"
              placeholder="Jane Doe"
            />
          </Field>
          
          <div className="grid grid-cols-2 gap-6">
            <Field label="Role or Title">
              <input
                type="text"
                name="role"
                defaultValue={speaker?.role}
                className="input"
                placeholder="Senior Pastor, Lead Engineer, etc."
              />
            </Field>

            <Field label="Organization">
              <input
                type="text"
                name="organization"
                defaultValue={speaker?.organization}
                className="input"
                placeholder="Company or Church name"
              />
            </Field>
          </div>

          <Field
            label="Speaking Topic (Optional)"
            description="What will they be speaking about?"
          >
            <input
              type="text"
              name="topic"
              defaultValue={speaker?.topic}
              className="input"
              placeholder="The Future of Faith"
            />
          </Field>

          <Field
            label="Biography"
          >
            <textarea
              name="bio"
              rows={4}
              defaultValue={speaker?.bio}
              className="input"
              placeholder="A short bio about the speaker."
            />
          </Field>
        </div>
      </div>
    </form>
  );
}
