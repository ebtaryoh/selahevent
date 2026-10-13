"use client";

import { useState, useEffect } from "react";
import { Sparkles, Play, Pause, RotateCcw, Volume2, VolumeX, Shield, Heart, Radio, ExternalLink } from "lucide-react";
import { cn } from "@/lib/format";

const DAILY_MEDITATIONS = [
  {
    verse: "Be still, and know that I am God: I will be exalted among the nations, I will be exalted in the earth.",
    reference: "Psalm 46:10",
    theme: "Surrender & Quiet Confidence",
    reflection:
      "In a noisy world that demands hurry, God invites you to be still. Cease striving. The battle is not yours to win by anxiety, but by resting in His sovereignty. Breathe in His grace, and let go of the pressure to control tomorrow.",
    declaration: "Today, I cast every anxious thought at the feet of Jesus. God is fighting for me, and I walk in undisturbed peace.",
  },
  {
    verse: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
    reference: "Philippians 4:6-7",
    theme: "Peace That Surpasses Understanding",
    reflection:
      "Thanksgiving turns worry into worship. Before the answer arrives, thank the Father that He already hears you. His peace will stand guard over your heart and mind like an unshakeable fortress.",
    declaration: "The peace of God guards my heart today. I choose gratitude over worry and faith over fear.",
  },
  {
    verse: "Those who wait on the Lord shall renew their strength; they shall mount up with wings like eagles, they shall run and not be weary, they shall walk and not faint.",
    reference: "Isaiah 40:31",
    theme: "Divine Strength & Renewal",
    reflection:
      "Waiting on God is not passive idleness; it is active spiritual alignment. As you pause in His presence, the exhaustion of the week is replaced with supernatural stamina.",
    declaration: "My strength is being renewed by the Holy Spirit. I will run the race set before me without growing faint.",
  },
];

export function DailySelahMeditation() {
  const [dayIndex, setDayIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale Grace" | "Hold Peace" | "Exhale Worry">("Inhale Grace");

  const meditation = DAILY_MEDITATIONS[dayIndex % DAILY_MEDITATIONS.length];

  useEffect(() => {
    // Select daily meditation based on day of month
    const day = new Date().getDate();
    setDayIndex(day % DAILY_MEDITATIONS.length);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);

        // 12-second breathing cycle: 4s inhale, 4s hold, 4s exhale
        const cycle = secondsLeft % 12;
        if (cycle >= 8) {
          setBreathPhase("Inhale Grace");
        } else if (cycle >= 4) {
          setBreathPhase("Hold Peace");
        } else {
          setBreathPhase("Exhale Worry");
        }
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(60);
    setBreathPhase("Inhale Grace");
  };

  const progress = ((60 - secondsLeft) / 60) * 100;

  return (
    <div className="space-y-8">
      {/* Hero Scripture Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[rgba(192,138,46,0.3)] bg-gradient-to-b from-[rgba(192,138,46,0.08)] to-paper p-6 sm:p-9 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brass/20 text-brass">
              <Sparkles size={14} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-brass">
              Today&apos;s Selah Pause · Scripture & Reflection
            </span>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-warm-300">
            {meditation.theme}
          </span>
        </div>

        <div className="mt-7 space-y-4">
          <blockquote className="font-serif text-xl sm:text-2xl leading-relaxed text-ink italic">
            &ldquo;{meditation.verse}&rdquo;
          </blockquote>
          <div className="text-sm font-semibold tracking-wide text-brass-light">
            — {meditation.reference}
          </div>
        </div>

        {/* 60-Second Selah Meditation Box */}
        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-sm font-bold text-ink">
                  Take a 60-Second Selah Pause
                </h4>
              </div>
              <p className="mt-1 text-xs text-warm-500 max-w-md">
                Pause your day. Align your heartbeat with heaven. Inhale God&apos;s grace, hold His peace, and exhale worldly anxiety.
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Circular pulse / timer */}
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-brass/40 bg-brass/10">
                <div
                  className={cn(
                    "absolute inset-1 rounded-full transition-all duration-1000",
                    isActive ? "animate-ping opacity-25 bg-brass" : "opacity-0"
                  )}
                />
                <span className="tnum font-display text-lg font-bold text-brass">
                  {secondsLeft}s
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={toggleTimer}
                  className={cn(
                    "btn !py-2 !px-4 !text-xs font-semibold cursor-pointer shadow-sm transition-all",
                    isActive
                      ? "btn-secondary text-ink border-white/20"
                      : "btn-brass shadow-brass/20"
                  )}
                >
                  {isActive ? (
                    <>
                      <Pause size={14} /> Pause
                    </>
                  ) : (
                    <>
                      <Play size={14} /> {secondsLeft < 60 ? "Resume" : "Begin Selah"}
                    </>
                  )}
                </button>
                {secondsLeft < 60 && (
                  <button
                    type="button"
                    onClick={resetTimer}
                    className="flex items-center gap-1 text-[0.7rem] text-warm-500 hover:text-ink transition-colors"
                  >
                    <RotateCcw size={11} /> Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {isActive && (
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="font-semibold text-brass animate-pulse">
                Current Breathing Pace: {breathPhase}
              </span>
              <span className="text-warm-500">{Math.round(progress)}% Complete</span>
            </div>
          )}
        </div>

        {/* Guided Reflection & Daily Declaration */}
        <div className="mt-7 grid gap-5 sm:grid-cols-2 pt-6 border-t border-white/10">
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-warm-400">
              Spiritual Reflection
            </h5>
            <p className="text-xs leading-relaxed text-warm-600">
              {meditation.reflection}
            </p>
          </div>
          <div className="rounded-xl border border-brass/20 bg-brass/5 p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brass">
              <Shield size={13} /> Daily Declaration of Faith
            </div>
            <p className="text-xs font-medium text-ink italic leading-relaxed">
              &ldquo;{meditation.declaration}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Daily Live Altars & Christian Fellowship Schedule */}
      <div className="rounded-2xl border border-white/10 bg-paper p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-emerald-400 animate-pulse" />
              <h3 className="font-display text-lg font-semibold text-ink">
                Today&apos;s Live Prayer Altars & Daily Broadcasts
              </h3>
            </div>
            <p className="mt-1 text-xs text-warm-500">
              Connect with ongoing corporate prayers and teachings happening across the body of Christ today.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between">
            <div>
              <span className="inline-block rounded bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-400 uppercase tracking-wider">
                Daily 6:00 AM WAT
              </span>
              <h4 className="mt-2 font-semibold text-sm text-ink">
                Morning Command & Word Altar
              </h4>
              <p className="mt-1 text-xs text-warm-500 line-clamp-2">
                Start your morning speaking scripture over your family, work, and city before starting the day.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-warm-400">Live Audio / Mixlr</span>
              <span className="text-brass font-medium flex items-center gap-1">
                Open <ExternalLink size={12} />
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between">
            <div>
              <span className="inline-block rounded bg-brass/10 px-2 py-0.5 text-[0.65rem] font-bold text-brass uppercase tracking-wider">
                Daily 12:00 PM
              </span>
              <h4 className="mt-2 font-semibold text-sm text-ink">
                Midday Intercession for Nations
              </h4>
              <p className="mt-1 text-xs text-warm-500 line-clamp-2">
                15 minutes of quiet lunch-hour intercession for persecuted Christians and community breakthrough.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-warm-400">Community Altar</span>
              <span className="text-brass font-medium flex items-center gap-1">
                Join <ExternalLink size={12} />
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between">
            <div>
              <span className="inline-block rounded bg-purple-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-purple-400 uppercase tracking-wider">
                Evening 8:00 PM
              </span>
              <h4 className="mt-2 font-semibold text-sm text-ink">
                Evening Praise & Thanksgiving
              </h4>
              <p className="mt-1 text-xs text-warm-500 line-clamp-2">
                Unwind with soothing acoustic worship, scripture reading, and testimonies before bed.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-warm-400">YouTube Stream</span>
              <span className="text-brass font-medium flex items-center gap-1">
                Listen <ExternalLink size={12} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
