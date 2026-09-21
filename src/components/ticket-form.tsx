"use client";

import { useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { Field } from "@/components/ui";
import {
  createTicketType,
  updateTicketType,
  deleteTicketType,
} from "@/lib/actions";
import { useRouter } from "next/navigation";

export function TicketForm({
  eventId,
  ticket,
  currency = "NGN",
}: {
  eventId: string;
  ticket?: any;
  currency?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isEditing = !!ticket;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    // Ensure capacity and price are passed correctly if empty
    if (!formData.get("capacity")) formData.set("capacity", "0");
    if (!formData.get("price")) formData.set("price", "0");

    let res;
    if (isEditing) {
      res = await updateTicketType(ticket.id, eventId, formData);
    } else {
      res = await createTicketType(eventId, formData);
    }

    if (res?.error) {
      setError(res.error);
      setSubmitting(false);
    }
    // Success will redirect automatically from the server action
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this ticket type? This action cannot be undone.")) {
      setDeleting(true);
      const res = await deleteTicketType(ticket.id, eventId);
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
            href={`/dashboard/events/${eventId}/tickets`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(22,19,17,0.11)] transition-colors hover:bg-[rgba(22,19,17,0.04)]"
          >
            <ArrowLeft size={16} className="text-ink" />
          </Link>
          <h1 className="font-display text-[1.75rem] font-semibold text-ink">
            {isEditing ? "Edit Ticket" : "New Ticket"}
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
              {deleting ? "Deleting..." : "Delete ticket"}
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
            Save ticket
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
          Ticket Details
        </h2>

        <div className="grid gap-6">
          <Field label="Ticket name" description="e.g. General Admission, VIP, Early Bird">
            <input
              type="text"
              name="name"
              required
              defaultValue={ticket?.name}
              className="input"
              placeholder="General Admission"
            />
          </Field>

          <Field
            label="Description"
            description="Briefly describe what this ticket includes."
          >
            <textarea
              name="description"
              rows={3}
              defaultValue={ticket?.description}
              className="input"
              placeholder="Standard access to the event."
            />
          </Field>
          
          <div className="grid grid-cols-2 gap-6">
            <Field
              label={`Price (${currency})`}
              description="Enter 0 for free tickets."
            >
              <input
                type="number"
                name="price"
                min="0"
                step="1"
                required
                defaultValue={ticket?.price ?? 0}
                className="input"
              />
            </Field>

            <Field
              label="Capacity"
              description="Enter 0 for unlimited places."
            >
              <input
                type="number"
                name="capacity"
                min="0"
                step="1"
                required
                defaultValue={ticket?.capacity ?? 0}
                className="input"
              />
            </Field>
          </div>

          <Field
            label="Benefits (One per line)"
            description="List specific perks for this ticket type. These appear as checkmarks."
          >
            <textarea
              name="benefits"
              rows={5}
              defaultValue={ticket?.benefits?.join("\n")}
              className="input"
              placeholder="Priority seating\nExclusive lunch\nMeet & greet"
            />
          </Field>

          <label className="flex items-start gap-3 mt-4">
            <input
              type="checkbox"
              name="isVisible"
              defaultChecked={ticket ? ticket.isVisible : true}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-brass focus:ring-brass"
            />
            <div>
              <div className="text-[0.925rem] font-medium text-ink">
                Visible to public
              </div>
              <div className="text-[0.825rem] text-warm-500">
                Turn this off to hide the ticket from the registration page.
              </div>
            </div>
          </label>
        </div>
      </div>
    </form>
  );
}
