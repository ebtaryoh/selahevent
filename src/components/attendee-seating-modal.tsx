"use client";

import { useState, useTransition } from "react";
import { Utensils, X, Check, Loader2 } from "lucide-react";
import { updateAttendeeSeating } from "@/lib/actions";

interface AttendeeSeatingModalProps {
  eventId: string;
  registrationId: string;
  attendeeName: string;
  currentTable?: string | null;
  currentSeat?: string | null;
}

export function AttendeeSeatingModal({
  eventId,
  registrationId,
  attendeeName,
  currentTable,
  currentSeat,
}: AttendeeSeatingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState(currentTable || "");
  const [seatNumber, setSeatNumber] = useState(currentSeat || "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateAttendeeSeating(
        eventId,
        registrationId,
        tableNumber,
        seatNumber
      );
      if (res?.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-warm-200 bg-white hover:bg-parchment-deep text-ink transition-colors cursor-pointer"
        title="Assign table or seat number"
      >
        <Utensils size={12} className="text-[var(--color-brass)]" />
        <span>{currentTable ? `${currentTable}${currentSeat ? ` (Seat ${currentSeat})` : ""}` : "Assign Table"}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-[rgba(22,19,17,0.15)] bg-paper p-6 text-ink shadow-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(22,19,17,0.08)] pb-3">
              <div className="flex items-center gap-2">
                <Utensils size={18} className="text-[var(--color-brass-deep)]" />
                <h3 className="font-display text-base font-semibold text-ink">
                  Table &amp; Seat Allocation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-warm-400 hover:text-ink hover:bg-warm-100"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-3 text-xs text-warm-600">
              Assign seating for <strong>{attendeeName}</strong>. This displays when their pass is scanned at the entrance turnstile.
            </p>

            {error && (
              <div className="mt-3 p-2 rounded-lg bg-red-50 text-red-600 text-xs">
                {error}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Table Name or Number
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. Table 04, High Table, Groom's Family"
                  className="input !w-full !text-xs !py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Seat Number <span className="font-normal text-warm-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={seatNumber}
                  onChange={(e) => setSeatNumber(e.target.value)}
                  placeholder="e.g. 02, A, VIP-1"
                  className="input !w-full !text-xs !py-2"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-[rgba(22,19,17,0.08)] pt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost !text-xs !py-1.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="btn btn-primary !text-xs !py-1.5 flex items-center gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={13} /> Save Seating
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
