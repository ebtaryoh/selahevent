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

  const [badge, setBadge] = useState<string>(ticket?.badge || "");
  const [benefitsText, setBenefitsText] = useState<string>(ticket?.benefits?.join("\n") || "");
  const [hasLodging, setHasLodging] = useState<boolean>(
    Boolean(
      ticket?.badge?.toLowerCase().includes("chalet") ||
      ticket?.badge?.toLowerCase().includes("lodging") ||
      ticket?.badge?.toLowerCase().includes("hotel") ||
      ticket?.badge?.toLowerCase().includes("room") ||
      ticket?.description?.toLowerCase().includes("chalet") ||
      ticket?.description?.toLowerCase().includes("hotel") ||
      ticket?.description?.toLowerCase().includes("lodging")
    )
  );

  const lodgingPresets = [
    {
      label: "Executive Chalet",
      badge: "Executive Chalet Included",
      perks: ["Private Executive Chalet with ensuite bathroom", "Air-conditioned with premium furnishings", "Complimentary daily breakfast", "Priority event & welfare assistance"],
    },
    {
      label: "Partner Hotel Room",
      badge: "Hotel Room Included",
      perks: ["Reserved room at partner hotel near venue", "Shuttle transport between hotel & event grounds", "Private ensuite room & amenities"],
    },
    {
      label: "Camp Guest House",
      badge: "Guest House Included",
      perks: ["On-site Camp Guest House accommodation", "Double occupancy room with clean bedding", "Proximity to main auditorium"],
    },
    {
      label: "AC Dormitory Bed",
      badge: "AC Dorm Bed Included",
      perks: ["Bed space in executive air-conditioned dorm", "Individual storage locker & charging point", "Clean shared facilities"],
    },
  ];

  const applyLodgingPreset = (preset: typeof lodgingPresets[0]) => {
    setBadge(preset.badge);
    setHasLodging(true);
    // Merge perks cleanly
    const existing = benefitsText.split("\n").map(b => b.trim()).filter(Boolean);
    const newPerks = preset.perks.filter(p => !existing.includes(p));
    const combined = [...existing, ...newPerks].join("\n");
    setBenefitsText(combined);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[44rem]">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/events/${eventId}/tickets`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.11)] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
          >
            <ArrowLeft size={16} className="text-ink" />
          </Link>
          <h1 className="font-display text-[1.75rem] font-semibold text-ink">
            {isEditing ? "Edit Ticket Package" : "New Ticket Package"}
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

      <div className="grid gap-8 rounded-[16px] border border-[rgba(255,255,255,0.09)] bg-paper p-7">
        <h2 className="font-display text-[1.25rem] font-medium text-ink">
          Ticket Details
        </h2>

        <div className="grid gap-6">
          <Field label="Ticket name" description="e.g. General Admission, VIP Package, Executive Chalet Pass">
            <input
              type="text"
              name="name"
              required
              defaultValue={ticket?.name}
              className="input"
              placeholder="e.g. Executive Chalet Package"
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
              placeholder="Standard access to all sessions plus accommodation."
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

          {/* Pass-Through Convenience Fee Toggle */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4.5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="passFeeToAttendee"
                defaultChecked={ticket?.passFeeToAttendee ?? true}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-ink">
                    Pass Payment Processing Fee to Attendee
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[0.6875rem] font-semibold text-emerald-700 dark:text-emerald-300">
                    ✨ Church Receives 100%
                  </span>
                </div>
                <p className="mt-1 text-xs text-warm-500 leading-relaxed">
                  Recommended for Christian ministries. Attendees cover the small online checkout fee (e.g. 1.5% + ₦100) at payment, ensuring your church receives 100% of the ticket face value without deductions.
                </p>
              </div>
            </label>
          </div>

          {/* Badge & Highlight */}
          <Field
            label="Badge / Highlight Pill (Optional)"
            description="Displays as a gold tag above the ticket on the public registration page."
          >
            <div className="flex flex-col gap-2">
              <input
                type="text"
                name="badge"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="input"
                placeholder="e.g. Executive Chalet Included, VIP, Most Popular"
              />
              {badge ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-warm-500">Live preview:</span>
                  <span className="pill pill-live !text-[0.6875rem] font-semibold">
                    {badge}
                  </span>
                </div>
              ) : null}
            </div>
          </Field>

          {/* Accommodation Inclusion Box */}
          <div className="rounded-xl border border-[rgba(192,138,46,0.35)] bg-[rgba(192,138,46,0.06)] p-5">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="lodgingIncludedToggle"
                checked={hasLodging}
                onChange={(e) => setHasLodging(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-warm-300 text-brass focus:ring-brass"
              />
              <div className="flex-1">
                <label htmlFor="lodgingIncludedToggle" className="cursor-pointer font-semibold text-ink text-sm">
                  🏨 This Package Includes Accommodation / Lodging
                </label>
                <p className="mt-1 text-xs text-warm-600 leading-relaxed">
                  Tag this ticket package with specific lodging (such as Executive Chalets or Partner Hotel Rooms). Attendees who buy this tier are automatically accounted for, and your welfare team can filter the attendee list by this package to assign rooms.
                </p>

                {hasLodging && (
                  <div className="mt-4 pt-4 border-t border-[rgba(192,138,46,0.2)]">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-brass-deep)] mb-2.5">
                      1-Click Room Presets (Auto-adds badge &amp; perks)
                    </span>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {lodgingPresets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyLodgingPreset(preset)}
                          className="flex flex-col items-start rounded-lg border border-[rgba(192,138,46,0.25)] bg-white/70 p-3 text-left transition-all hover:border-[var(--color-brass-deep)] hover:bg-white shadow-xs"
                        >
                          <span className="text-xs font-semibold text-ink">
                            + {preset.label}
                          </span>
                          <span className="mt-0.5 text-[0.7rem] text-warm-500">
                            Badge: &ldquo;{preset.badge}&rdquo;
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Field
            label="Benefits & Perks (One per line)"
            description="List specific perks for this ticket type. These appear as checkmarks for attendees."
          >
            <textarea
              name="benefits"
              rows={6}
              value={benefitsText}
              onChange={(e) => setBenefitsText(e.target.value)}
              className="input font-mono text-[0.825rem]"
              placeholder="Priority seating&#10;Exclusive lunch&#10;Executive Chalet room included&#10;Meet & greet"
            />
          </Field>

          <label className="flex items-start gap-3 mt-2">
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
