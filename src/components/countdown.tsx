"use client";

import { useEffect, useState } from "react";
import { timeUntil } from "@/lib/format";

export function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(() => timeUntil(target));

  useEffect(() => {
    const id = window.setInterval(() => setNow(timeUntil(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const units = [
    { label: "Days", value: now.days },
    { label: "Hours", value: now.hours },
    { label: "Minutes", value: now.minutes },
    { label: "Seconds", value: now.seconds },
  ];

  return (
    <div
      className="grid grid-cols-4 gap-2 sm:gap-3"
      role="timer"
      aria-live="polite"
      aria-label={
        now.passed
          ? "This event has already started"
          : `Event starts in ${now.days} days`
      }
    >
      {units.map((unit) => (
        <div
          key={unit.label}
          className="rounded-[11px] border border-[rgba(22,19,17,0.11)] bg-paper px-2 py-3 text-center sm:px-3 sm:py-4"
        >
          <div className="font-display tnum text-[clamp(1.35rem,3.6vw,1.95rem)] leading-none font-semibold text-ink">
            {String(unit.value).padStart(2, "0")}
          </div>
          <div className="eyebrow mt-1.5 text-[0.52rem] text-warm-400">
            {unit.label}
          </div>
        </div>
      ))}
    </div>
  );
}
