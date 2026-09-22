"use client";

import { useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { Field } from "@/components/ui";
import { createTask } from "@/lib/actions/tasks";
import { useRouter } from "next/navigation";

export function TaskForm({
  events,
}: {
  events: any[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const res = await createTask(formData);

    if (res?.error) {
      setError(res.error);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[42rem]">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(22,19,17,0.11)] transition-colors hover:bg-[rgba(22,19,17,0.04)]"
          >
            <ArrowLeft size={16} className="text-ink" />
          </Link>
          <h1 className="font-display text-[1.75rem] font-semibold text-ink">
            New Task
          </h1>
        </div>
        <div className="flex items-center gap-3">
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
            Save task
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
          Task Details
        </h2>

        <div className="grid gap-6">
          <Field label="Task Title" description="What needs to be done?">
            <input
              type="text"
              name="title"
              required
              className="input"
              placeholder="e.g. Confirm catering menu"
            />
          </Field>

          <Field
            label="Related Event"
            description="Which event is this task for? (Optional)"
          >
            <select name="eventId" className="input">
              <option value="">-- Global / No specific event --</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </Field>
          
          <div className="grid grid-cols-2 gap-6">
            <Field label="Category">
              <select name="category" className="input">
                <option value="General">General</option>
                <option value="Logistics">Logistics</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
              </select>
            </Field>

            <Field label="Priority">
              <select name="priority" className="input">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Field label="Assignee" description="Who is responsible?">
              <input
                type="text"
                name="assignee"
                className="input"
                placeholder="e.g. John Doe"
              />
            </Field>

            <Field label="Due Date" description="When should this be completed?">
              <input
                type="datetime-local"
                name="dueAt"
                className="input"
              />
            </Field>
          </div>
        </div>
      </div>
    </form>
  );
}
