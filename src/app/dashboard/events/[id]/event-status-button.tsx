"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { EventStatusModal } from "@/components/event-status-modal";

interface EventStatusButtonProps {
  event: {
    id: string;
    title: string;
    status: string;
    cancellationReason?: string | null;
  };
}

export function EventStatusButton({ event }: EventStatusButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn-light"
        title="Change status, cancel, or postpone this event"
      >
        <SlidersHorizontal size={15} /> Status
      </button>

      <EventStatusModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        event={event}
      />
    </>
  );
}
