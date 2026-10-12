"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, EyeOff, Loader2, X, ShieldAlert } from "lucide-react";
import { setEventStatus } from "@/lib/actions";
import { cn } from "@/lib/utils";

type EventStatus = "published" | "draft" | "cancelled" | "postponed" | "completed";

interface EventStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    status: string;
    cancellationReason?: string | null;
  };
}

export function EventStatusModal({ isOpen, onClose, event }: EventStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<EventStatus>(
    (event.status as EventStatus) || "published"
  );
  const [reason, setReason] = useState(event.cancellationReason || "");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      const res = await setEventStatus(event.id, selectedStatus, reason);
      if (res?.error) {
        setError(res.error);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update event status");
    } finally {
      setIsPending(false);
    }
  };

  const statusOptions: Array<{
    id: EventStatus;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badgeStyle: string;
  }> = [
    {
      id: "published",
      label: "Published (Live)",
      description: "Publicly visible, active registrations and ticket sales.",
      icon: CheckCircle2,
      accentColor: "text-emerald-500",
      badgeStyle: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
    },
    {
      id: "postponed",
      label: "Postponed",
      description: "Rescheduled to a later date. Registrations are paused with an attendee notice.",
      icon: Clock,
      accentColor: "text-amber-500",
      badgeStyle: "border-amber-500/30 bg-amber-500/10 text-amber-700",
    },
    {
      id: "cancelled",
      label: "Cancelled",
      description: "Event will not hold. Registrations blocked, check-in deactivated, notice posted.",
      icon: ShieldAlert,
      accentColor: "text-red-500",
      badgeStyle: "border-red-500/30 bg-red-500/10 text-red-700",
    },
    {
      id: "draft",
      label: "Draft",
      description: "Hidden from the public directory while planning.",
      icon: EyeOff,
      accentColor: "text-warm-500",
      badgeStyle: "border-warm-300 bg-warm-100 text-warm-700",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl rounded-2xl border border-[rgba(22,19,17,0.12)] bg-paper p-6 sm:p-8 shadow-2xl text-ink max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-5">
          <div>
            <h2 id="status-modal-title" className="font-display text-xl sm:text-2xl font-semibold text-ink">
              Manage Event Status
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-warm-600">
              Update the visibility and operational state for <span className="font-semibold text-ink">{event.title}</span>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-warm-500 hover:bg-black/5 hover:text-ink transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs sm:text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-warm-500">
              Select Lifecycle State
            </label>
            <div className="grid gap-2.5">
              {statusOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedStatus === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedStatus(opt.id)}
                    className={cn(
                      "flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl border text-left transition-all",
                      isSelected
                        ? "border-[var(--color-brass)] bg-[rgba(226,192,115,0.08)] shadow-sm ring-1 ring-[var(--color-brass)]"
                        : "border-black/10 bg-white/60 hover:border-warm-400"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", opt.accentColor)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-ink">{opt.label}</span>
                        {event.status === opt.id && (
                          <span className="text-[0.65rem] uppercase font-bold px-1.5 py-0.5 rounded bg-warm-200 text-warm-700">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-warm-600 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {(selectedStatus === "cancelled" || selectedStatus === "postponed") && (
            <div className="space-y-2 rounded-xl border border-[rgba(22,19,17,0.1)] bg-white/70 p-4 animate-in fade-in">
              <label htmlFor="reason" className="block text-xs font-semibold text-ink">
                {selectedStatus === "cancelled" ? "Cancellation Statement / Reason" : "Postponement Note"}
              </label>
              <p className="text-xs text-warm-500">
                This notice will be displayed prominently to attendees visiting the event landing page.
              </p>
              <textarea
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  selectedStatus === "cancelled"
                    ? "e.g., Due to unforeseen venue maintenance, this conference has been cancelled. All paid tickets will be fully refunded within 3 to 5 business days."
                    : "e.g., This event has been postponed. The organizing committee will announce the rescheduled date shortly. Existing registrations remain valid."
                }
                className="w-full rounded-lg border border-black/15 bg-white p-3 text-xs sm:text-sm text-ink placeholder:text-warm-400 focus:border-[var(--color-brass)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brass)]"
              />
            </div>
          )}

          {selectedStatus === "cancelled" && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-800 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Cancellation Safety Checklist:</span>
                <ul className="mt-1.5 list-disc list-inside space-y-1 text-red-700">
                  <li>Public registration and ticket sales will be locked immediately.</li>
                  <li>Ticket scanner verification at the door will reject entries.</li>
                  <li>Schema.org will report the event as Cancelled to search engines.</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="btn btn-ghost !py-2.5 !text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "btn !py-2.5 !text-xs font-semibold text-white",
                selectedStatus === "cancelled"
                  ? "bg-red-600 hover:bg-red-700"
                  : selectedStatus === "postponed"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "btn-primary"
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-1.5" />
                  Updating...
                </>
              ) : selectedStatus === "cancelled" ? (
                "Confirm Event Cancellation"
              ) : selectedStatus === "postponed" ? (
                "Postpone Event"
              ) : (
                "Save Status"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
