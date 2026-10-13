"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Loader2,
  Ticket,
  CalendarDays,
  MapPin,
  Utensils,
  BedDouble,
  MessageSquare,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { formatTime } from "@/lib/format";
import { SaveTicketImageButton } from "./save-ticket-image-button";

export interface RetrievedTicket {
  id: string;
  ticketCode: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  eventTitle: string;
  eventSlug: string;
  eventStartsAt: string | null;
  eventVenue: string;
  eventCity: string;
  coverImage?: string | null;
  ticketName: string;
  tableNumber?: string | null;
  seatNumber?: string | null;
  accommodation?: boolean;
  accommodationType?: string | null;
  gender?: string | null;
  qrCodeUrl: string;
  passUrl: string;
  pdfUrl: string;
  whatsappUrl: string;
}

export function TicketLookupForm({
  eventSlug,
  eventTitle,
}: {
  eventSlug?: string;
  eventTitle?: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tickets, setTickets] = useState<RetrievedTicket[]>([]);
  const [searchedQuery, setSearchedQuery] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/my-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: cleanQuery,
          eventSlug: eventSlug || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to lookup your pass.");
      }

      setTickets(data.tickets || []);
      setSearchedQuery(cleanQuery);
      setStatus("success");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Could not retrieve pass. Please try again.");
    }
  };

  const resetSearch = () => {
    setStatus("idle");
    setQuery("");
    setTickets([]);
    setErrorMessage(null);
  };

  return (
    <div className="w-full">
      {status === "idle" || status === "loading" || (status === "error" && tickets.length === 0) ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="lookup-query" className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1.5">
              Email Address, Phone Number or Ticket Code
            </label>
            <div className="relative">
              <input
                id="lookup-query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 08012345678, name@gmail.com, or TKT-..."
                required
                className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3.5 pl-11 text-sm text-white placeholder-white/40 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass transition-all"
              />
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            </div>
            <p className="mt-1.5 text-[0.75rem] text-white/60">
              {eventTitle
                ? `Retrieving your pass for ${eventTitle}. Enter the phone or email you used.`
                : "Enter the email or phone number you used when registering on Selah."}
            </p>
          </div>

          <button
            type="submit"
            disabled={status === "loading" || !query.trim()}
            className="w-full btn btn-primary flex items-center justify-center gap-2 py-3.5 text-sm font-semibold disabled:opacity-50 shadow-md cursor-pointer"
          >
            {status === "loading" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Searching for your pass...
              </>
            ) : (
              <>
                <Ticket size={16} />
                Find My Pass
              </>
            )}
          </button>

          {errorMessage && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>
      ) : null}

      {/* Results View */}
      {status === "success" && (
        <div className="space-y-6">
          {tickets.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Search size={22} />
              </div>
              <h3 className="font-semibold text-white text-base">No Registration Found</h3>
              <p className="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
                We couldn&apos;t find an active registration matching <strong className="text-white">&quot;{searchedQuery}&quot;</strong>.
                Please check for typos, try your phone number instead of email, or register below.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={resetSearch}
                  className="btn btn-secondary !text-xs !py-2 !px-4"
                >
                  <RefreshCw size={13} className="mr-1.5" /> Try Another Search
                </button>
                {eventSlug && (
                  <Link
                    href={`/e/${eventSlug}/register`}
                    className="btn btn-primary !text-xs !py-2 !px-4"
                  >
                    Register for Event
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 size={14} />
                  </span>
                  <span className="text-xs font-semibold text-white">
                    Found {tickets.length} {tickets.length === 1 ? "Registration" : "Registrations"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resetSearch}
                  className="text-xs text-brass hover:underline flex items-center gap-1 font-medium"
                >
                  <RefreshCw size={12} /> New Search
                </button>
              </div>

              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="overflow-hidden rounded-2xl border border-brass/40 bg-gradient-to-b from-white/10 to-black/60 shadow-xl transition-all"
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-black/40">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="pill border-brass/40 bg-brass/20 text-brass-light !text-[0.65rem] !py-0.5 !px-2 font-semibold">
                          {t.ticketName}
                        </span>
                        <span className="font-mono text-xs text-white/60">
                          {t.ticketCode}
                        </span>
                      </div>
                      <h4 className="font-display font-semibold text-white text-lg mt-1 line-clamp-1">
                        {t.eventTitle}
                      </h4>
                      <p className="text-xs text-white/70">
                        Attendee: <strong className="text-white">{t.firstName} {t.lastName}</strong>
                      </p>
                    </div>

                    {/* Table / Seating / Dorm Badges */}
                    <div className="flex flex-wrap gap-1.5 self-start sm:self-center">
                      {t.tableNumber && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-brass/20 border border-brass/30 px-2.5 py-1 text-xs font-semibold text-brass">
                          <Utensils size={12} />
                          {t.tableNumber} {t.seatNumber && `· Seat ${t.seatNumber}`}
                        </span>
                      )}
                      {t.accommodation && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/20 border border-sky-500/30 px-2.5 py-1 text-xs font-semibold text-sky-300">
                          <BedDouble size={12} />
                          {t.accommodationType || (t.gender ? `${t.gender === 'male' ? "Men's" : "Women's"} Dorm` : "Lodging")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* QR Code and Quick Details */}
                  <div className="p-5 flex flex-col sm:flex-row items-center gap-5">
                    {/* QR Code */}
                    <div className="shrink-0 rounded-xl bg-white p-2.5 shadow-md border border-white/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.qrCodeUrl}
                        alt="Ticket QR Code"
                        className="h-28 w-28 rounded-lg object-contain"
                      />
                      <p className="mt-1 text-center font-mono text-[0.65rem] font-bold text-black tracking-wider">
                        {t.ticketCode}
                      </p>
                    </div>

                    {/* Event Logistics */}
                    <div className="flex-1 space-y-2 text-xs text-white/80">
                      {t.eventStartsAt && (
                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} className="text-brass shrink-0" />
                          <span>{new Date(t.eventStartsAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })} · {formatTime(t.eventStartsAt)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-brass shrink-0" />
                        <span className="line-clamp-1">{t.eventVenue}, {t.eventCity}</span>
                      </div>
                      <p className="text-[0.725rem] text-white/50 pt-1">
                        Present this QR code to the usher or turnstile scanner at the venue entrance.
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Footer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-3 bg-black/50 border-t border-white/10">
                    <a
                      href={t.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn !bg-emerald-600 hover:!bg-emerald-500 !text-white !text-xs !py-2.5 flex items-center justify-center gap-1.5 rounded-lg font-medium shadow-sm"
                    >
                      <MessageSquare size={14} /> WhatsApp
                    </a>
                    <SaveTicketImageButton
                      ticket={{
                        eventTitle: t.eventTitle,
                        attendeeName: `${t.firstName} ${t.lastName}`,
                        ticketCode: t.ticketCode,
                        ticketTier: t.ticketName,
                        qrCodeUrl: t.qrCodeUrl,
                        dateStr: t.eventStartsAt ? `${new Date(t.eventStartsAt).toLocaleDateString()} · ${formatTime(t.eventStartsAt)}` : "TBA",
                        venueName: t.eventVenue,
                        tableNumber: t.tableNumber,
                        seatNumber: t.seatNumber,
                        accommodationType: t.accommodationType,
                      }}
                      className="btn !bg-sky-600 hover:!bg-sky-500 !text-white !text-xs !py-2.5 flex items-center justify-center gap-1.5 rounded-lg font-medium shadow-sm cursor-pointer"
                    />
                    <Link
                      href={t.passUrl}
                      className="btn btn-primary !text-xs !py-2.5 flex items-center justify-center gap-1.5 rounded-lg font-medium shadow-sm"
                    >
                      <ExternalLink size={14} /> Live Badge
                    </Link>
                    <a
                      href={t.pdfUrl}
                      download={`ticket-${t.ticketCode}.pdf`}
                      className="btn btn-secondary !text-xs !py-2.5 flex items-center justify-center gap-1.5 rounded-lg font-medium"
                    >
                      <Download size={14} /> PDF Ticket
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
