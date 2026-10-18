"use client";

import { useEffect, useState } from "react";
import { timeUntil } from "@/lib/format";

export function Countdown({
  target,
  variant = "default",
}: {
  target: string;
  variant?: "default" | "hero-glass";
}) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState({
    passed: false,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  useEffect(() => {
    setMounted(true);
    setNow(timeUntil(target));
    const id = window.setInterval(() => setNow(timeUntil(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const units = [
    { label: "Days", value: now.days },
    { label: "Hours", value: now.hours },
    { label: "Minutes", value: now.minutes },
    { label: "Seconds", value: now.seconds },
  ];

  if (variant === "hero-glass") {
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
            className="group relative overflow-hidden rounded-2xl border border-white/20 bg-black/45 px-2 py-3 text-center backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-300 hover:border-brass/50 sm:px-3 sm:py-3.5"
          >
            {/* Subtle inner top glow highlight */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-brass/40 to-transparent pointer-events-none" />
            <div
              suppressHydrationWarning
              className="font-display tnum text-[clamp(1.5rem,3.8vw,2.2rem)] leading-none font-bold text-parchment drop-shadow-[0_2px_12px_rgba(226,192,115,0.3)] transition-transform duration-300 group-hover:scale-105"
            >
              {mounted ? String(unit.value).padStart(2, "0") : "00"}
            </div>
            <div className="eyebrow mt-1.5 text-[0.56rem] sm:text-[0.6rem] font-bold tracking-[0.16em] uppercase text-brass-light/85">
              {unit.label}
            </div>
          </div>
        ))}
      </div>
    );
  }

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
          className="rounded-[11px] border border-[rgba(255,255,255,0.11)] bg-paper px-2 py-3 text-center sm:px-3 sm:py-4"
        >
          <div
            suppressHydrationWarning
            className="font-display tnum text-[clamp(1.35rem,3.6vw,1.95rem)] leading-none font-semibold text-ink"
          >
            {mounted ? String(unit.value).padStart(2, "0") : "00"}
          </div>
          <div className="eyebrow mt-1.5 text-[0.52rem] text-warm-400">
            {unit.label}
          </div>
        </div>
      ))}
    </div>
  );
}
