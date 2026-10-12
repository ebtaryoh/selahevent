"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Printer,
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  QrCode,
  Calendar,
  MapPin,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { formatRange } from "@/lib/format";

type PosterProps = {
  event: {
    id: string;
    title: string;
    slug: string;
    startsAt: Date;
    endsAt: Date;
    venueName: string | null;
    venueAddress: string | null;
    city: string;
    organizationName: string;
    brandColor?: string | null;
  };
};

type ThemeStyle = "classic" | "high-contrast" | "dark";

export function VenuePoster({ event }: PosterProps) {
  const [theme, setTheme] = useState<ThemeStyle>("classic");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const registerUrl = origin ? `${origin}/e/${event.slug}/register` : `/e/${event.slug}/register`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(registerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pb-16">
      {/* On-Screen Toolbar (Hidden during Print) */}
      <div className="no-print mb-8 rounded-2xl border border-white/10 bg-paper/80 backdrop-blur-md p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/events/${event.id}`}
              className="btn btn-ghost !px-3.5 !py-2 text-xs"
            >
              <ArrowLeft size={15} /> Back to event
            </Link>
            <div className="h-4 w-[1px] bg-white/10" />
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-400">
              Venue Door Signage
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Theme switcher */}
            <div className="flex items-center rounded-xl border border-black/10 bg-warm-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setTheme("classic")}
                className={`rounded-lg px-3 py-1 font-medium transition-colors ${
                  theme === "classic" ? "bg-white text-ink shadow-xs" : "text-warm-500 hover:text-ink"
                }`}
              >
                Warm Cream
              </button>
              <button
                type="button"
                onClick={() => setTheme("high-contrast")}
                className={`rounded-lg px-3 py-1 font-medium transition-colors ${
                  theme === "high-contrast" ? "bg-white text-ink shadow-xs" : "text-warm-500 hover:text-ink"
                }`}
              >
                Printer B&W
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`rounded-lg px-3 py-1 font-medium transition-colors ${
                  theme === "dark" ? "bg-black text-white shadow-xs" : "text-warm-500 hover:text-ink"
                }`}
              >
                Midnight
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="btn btn-ghost !px-3.5 !py-2 text-xs"
            >
              {copied ? <Check size={14} className="text-signal-green" /> : <Copy size={14} />}
              {copied ? "Link copied" : "Copy link"}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-primary !px-5 !py-2 text-xs shadow-md"
            >
              <Printer size={15} /> Print Poster (A4 / Letter)
            </button>
          </div>
        </div>
      </div>

      {/* Poster Canvas */}
      <div className="flex justify-center">
        <div
          id="venue-poster-sheet"
          className={`poster-sheet relative w-full max-w-[680px] overflow-hidden rounded-3xl border transition-all ${
            theme === "classic"
              ? "bg-[#faf8f5] text-[#1c1917] border-[#e7e0d4] shadow-xl"
              : theme === "high-contrast"
              ? "bg-white text-black border-black/20 shadow-xl"
              : "bg-[#0b1713] text-white border-white/10 shadow-2xl"
          }`}
          style={{ minHeight: "880px" }}
        >
          {/* Subtle decorative background texture */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[rgba(226,192,115,0.12)] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[rgba(226,192,115,0.08)] blur-3xl" />

          <div className="relative p-10 sm:p-14 flex flex-col justify-between" style={{ minHeight: "880px" }}>
            {/* Header: Organization & Badge */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-warm-600">
                <Sparkles size={13} className="text-[var(--color-brass)]" />
                {event.organizationName}
              </div>

              {/* Event Title */}
              <h1 className="font-display mt-6 text-3xl font-bold leading-tight tracking-tight sm:text-4xl text-inherit">
                {event.title}
              </h1>

              {/* Event Metadata (Dates & Location) */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-medium text-warm-600 sm:text-sm">
                <div className="flex items-center gap-1.5">
                  <Calendar size={15} className="text-[var(--color-brass)]" />
                  <span>{formatRange(event.startsAt, event.endsAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-[var(--color-brass)]" />
                  <span>
                    {event.venueName ? `${event.venueName}, ` : ""}
                    {event.city}
                  </span>
                </div>
              </div>
            </div>

            {/* Centerpiece: Large Scannable QR Code */}
            <div className="my-8 flex flex-col items-center justify-center">
              <div className="relative rounded-3xl border-2 border-[rgba(226,192,115,0.4)] bg-white p-7 shadow-2xl">
                <QRCodeSVG
                  value={registerUrl}
                  size={240}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000000"
                  includeMargin={false}
                />
              </div>

              <div className="mt-6 text-center">
                <div className="font-display text-2xl font-bold tracking-tight text-inherit">
                  Scan to Register on Your Phone
                </div>
                <p className="mt-1.5 max-w-sm text-xs font-medium text-warm-500 sm:text-sm">
                  Point your smartphone camera at the code to register and get your digital entry pass immediately.
                </p>
              </div>
            </div>

            {/* Bottom 3 Simple Steps */}
            <div className="rounded-2xl border border-black/10 bg-black/5 p-5">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="flex flex-col items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-xs">
                    <Smartphone size={17} className="text-[var(--color-brass)]" />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-inherit">1. Scan</span>
                  <span className="text-[0.68rem] text-warm-500 leading-tight mt-0.5">
                    Open camera & tap link
                  </span>
                </div>

                <div className="flex flex-col items-center border-x border-black/10">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-xs">
                    <QrCode size={17} className="text-[var(--color-brass)]" />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-inherit">2. Register</span>
                  <span className="text-[0.68rem] text-warm-500 leading-tight mt-0.5">
                    Takes 30 seconds
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-xs">
                    <CheckCircle2 size={17} className="text-signal-green" />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-inherit">3. Check In</span>
                  <span className="text-[0.68rem] text-warm-500 leading-tight mt-0.5">
                    Show pass at the door
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Brand Note */}
            <div className="mt-6 text-center text-[0.65rem] tracking-wider uppercase text-warm-400">
              Powered by Selah Events · Instant Door Check-In
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Print Media Stylesheet */}
      <style jsx global>{`
        @media print {
          /* Hide all application shells, navigation bars, headers, and footers */
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header, nav, aside, .no-print, .site-header, .site-footer {
            display: none !important;
          }
          /* Full page print canvas centered cleanly */
          #venue-poster-sheet {
            max-width: 100% !important;
            width: 100% !important;
            min-height: 100vh !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
