"use client";

import { useState } from "react";
import { ArrowRight, Loader2, CalendarDays, MapPin, Tag, UploadCloud, ImageIcon } from "lucide-react";
import { createEvent } from "@/lib/actions";

export function CreateEventForm() {
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createEvent(formData);
    } catch (err) {
      console.error(err);
      setIsPending(false);
      alert("Failed to create event. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <div className="space-y-6">
        {/* Basic Details */}
        <div className="rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-paper p-6 shadow-sm">
          <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
            <Tag size={18} className="text-brass" /> Basic Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-ink">
                Event Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g. Annual Youth Retreat 2026"
                className="input !w-full"
              />
            </div>
            
            <div>
              <label htmlFor="eventType" className="mb-1.5 block text-sm font-medium text-ink">
                Event Type
              </label>
              <select
                id="eventType"
                name="eventType"
                required
                className="input !w-full bg-parchment"
              >
                <option value="conference">Conference</option>
                <option value="retreat">Retreat</option>
                <option value="worship">Worship Night</option>
                <option value="church_service">Church Service</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-ink">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                placeholder="Describe your event..."
                className="input !w-full !rounded-[12px] !py-3 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-paper p-6 shadow-sm">
          <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
            <CalendarDays size={18} className="text-brass" /> Date & Time
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startsAt" className="mb-1.5 block text-sm font-medium text-ink">
                Start Date & Time
              </label>
              <input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                required
                className="input !w-full"
              />
            </div>
            <div>
              <label htmlFor="endsAt" className="mb-1.5 block text-sm font-medium text-ink">
                End Date & Time
              </label>
              <input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                required
                className="input !w-full"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-paper p-6 shadow-sm">
          <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
            <MapPin size={18} className="text-brass" /> Location
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="venueName" className="mb-1.5 block text-sm font-medium text-ink">
                Venue Name
              </label>
              <input
                id="venueName"
                name="venueName"
                type="text"
                required
                placeholder="e.g. Main Auditorium"
                className="input !w-full"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-ink">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                placeholder="e.g. Lagos"
                className="input !w-full"
              />
            </div>
          </div>
        </div>

        {/* Media Upload */}
        <div className="rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-paper p-6 shadow-sm">
          <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
            <ImageIcon size={18} className="text-brass" /> Event Media
          </h2>
          
          <div>
            <label htmlFor="media" className="mb-1.5 block text-sm font-medium text-ink">
              Upload Photos & Videos
            </label>
            <p className="mb-4 text-sm text-warm-500">
              Showcase your event with high-quality promotional materials. You can select multiple files.
            </p>
            
            <div className="relative flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-[rgba(22,19,17,0.15)] bg-parchment py-12 transition-colors hover:border-[var(--color-brass)] hover:bg-[rgba(192,138,46,0.05)]">
              <UploadCloud size={40} className="mb-4 text-brass-light" />
              <p className="mb-1 text-sm font-semibold text-ink">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-warm-500">
                SVG, PNG, JPG, or MP4 (max 20MB)
              </p>
              <input
                id="media"
                name="media"
                type="file"
                multiple
                accept="image/*,video/*"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary !px-8 !py-3 w-full sm:w-auto"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Creating Event...
            </>
          ) : (
            <>
              Create Event
              <ArrowRight size={18} strokeWidth={2.1} className="ml-2" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
