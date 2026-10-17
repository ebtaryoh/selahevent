"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const SCRIPTURES = [
  {
    verse: "They that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
    ref: "Isaiah 40:31",
  },
  {
    verse: "Wait on the LORD: be of good courage, and He shall strengthen thine heart: wait, I say, on the LORD.",
    ref: "Psalm 27:14",
  },
  {
    verse: "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.",
    ref: "Psalm 46:10",
  },
  {
    verse: "The LORD is good unto them that wait for Him, to the soul that seeketh Him.",
    ref: "Lamentations 3:25",
  },
  {
    verse: "For where two or three are gathered together in My name, there am I in the midst of them.",
    ref: "Matthew 18:20",
  },
];

export function ChristianLoadingScreen({
  message = "Entering the Sanctuary...",
}: {
  message?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Pick a scripture randomly on mount, then rotate gently if loading is prolonged
    setIndex(Math.floor(Math.random() * SCRIPTURES.length));
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % SCRIPTURES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const scripture = SCRIPTURES[index];

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Sacred Cross & Chi-Rho Breathing Icon */}
      <div className="relative mb-8 flex items-center justify-center">
        {/* Pulsing sacred golden halos */}
        <div className="absolute h-28 w-28 rounded-full bg-brass/10 blur-xl animate-sacred-breathe" />
        <div className="absolute h-40 w-40 rounded-full bg-brass/5 blur-2xl animate-celestial" />

        {/* Central Sacred Cross Emblem */}
        <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl border border-brass/40 bg-parchment-deep shadow-[0_0_30px_rgba(226,192,115,0.25)]">
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-brass animate-pulse"
          >
            {/* Latin Cross with Chi-Rho sacred flourishes */}
            <path
              d="M32 6V58M16 20H48"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Chi-Rho loop at top right */}
            <path
              d="M32 8C39 8 43 12 43 16C43 20 39 24 32 24"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Divine Ray Dots */}
            <circle cx="32" cy="3" r="2" fill="currentColor" opacity="0.9" />
            <circle cx="12" cy="20" r="1.5" fill="currentColor" opacity="0.9" />
            <circle cx="52" cy="20" r="1.5" fill="currentColor" opacity="0.9" />
          </svg>
        </div>
      </div>

      {/* Welcoming Status Text */}
      <div className="inline-flex items-center gap-2 rounded-full border border-brass/25 bg-brass/10 px-4 py-1.5 text-xs font-semibold text-brass mb-5">
        <Sparkles size={13} className="text-brass-light animate-spin" style={{ animationDuration: "8s" }} />
        <span>{message}</span>
      </div>

      {/* Scripture Quote */}
      <div className="max-w-md mx-auto transition-opacity duration-700">
        <blockquote className="font-display text-base sm:text-lg italic text-ink/90 leading-relaxed font-light">
          &ldquo;{scripture.verse}&rdquo;
        </blockquote>
        <cite className="block mt-2.5 text-xs font-semibold tracking-wider uppercase text-brass">
          — {scripture.ref}
        </cite>
      </div>
    </div>
  );
}
