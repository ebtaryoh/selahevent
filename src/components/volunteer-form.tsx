"use client";

import { useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { Field } from "@/components/ui";
import {
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
} from "@/lib/actions/volunteers";
import { useRouter } from "next/navigation";

export function VolunteerForm({
  eventId,
  volunteer,
}: {
  eventId: string;
  volunteer?: any;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isEditing = !!volunteer;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    let res;
    if (isEditing) {
      res = await updateVolunteer(volunteer.id, eventId, formData);
    } else {
      res = await createVolunteer(eventId, formData);
    }

    if (res?.error) {
      setError(res.error);
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to remove this volunteer?")) {
      setDeleting(true);
      const res = await deleteVolunteer(volunteer.id, eventId);
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
            href={`/dashboard/events/${eventId}/volunteers`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(22,19,17,0.11)] transition-colors hover:bg-[rgba(22,19,17,0.04)]"
          >
            <ArrowLeft size={16} className="text-ink" />
          </Link>
          <h1 className="font-display text-[1.75rem] font-semibold text-ink">
            {isEditing ? "Edit Volunteer" : "Add Volunteer"}
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
              {deleting ? "Removing..." : "Remove"}
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
          Volunteer Details
        </h2>

        <div className="grid gap-6">
          <Field label="Full name">
            <input
              type="text"
              name="name"
              required
              defaultValue={volunteer?.name}
              className="input"
              placeholder="Jane Doe"
            />
          </Field>
          
          <div className="grid grid-cols-2 gap-6">
            <Field label="Department">
              <input
                type="text"
                name="department"
                required
                defaultValue={volunteer?.department}
                className="input"
                placeholder="Ushering, Media, Protocol..."
              />
            </Field>

            <Field label="Role">
              <input
                type="text"
                name="role"
                defaultValue={volunteer?.role || "Member"}
                className="input"
                placeholder="Member, Coordinator..."
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Field label="Phone number (Optional)">
              <input
                type="text"
                name="phone"
                defaultValue={volunteer?.phone}
                className="input"
                placeholder="+234..."
              />
            </Field>
            
            <Field label="Shift or availability (Optional)">
              <input
                type="text"
                name="shift"
                defaultValue={volunteer?.shift}
                className="input"
                placeholder="Morning shift"
              />
            </Field>
          </div>

          <Field label="Status">
            <select
              name="status"
              defaultValue={volunteer?.status || "confirmed"}
              className="input"
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="declined">Declined</option>
            </select>
          </Field>

          <label className="flex items-start gap-3 mt-4">
            <input
              type="checkbox"
              name="isLeader"
              defaultChecked={volunteer ? volunteer.isLeader : false}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-brass focus:ring-brass"
            />
            <div>
              <div className="text-[0.925rem] font-medium text-ink">
                Team Leader
              </div>
              <div className="text-[0.825rem] text-warm-500">
                Marks this person as a leader/coordinator for their department.
              </div>
            </div>
          </label>
        </div>
      </div>
    </form>
  );
}
