import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { registrations, events, ticketTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SelahMark } from "@/components/logo";
import { formatDate, formatTime } from "@/lib/format";
import Image from "next/image";
import { CalendarDays, MessageSquare, Utensils, AlertTriangle } from "lucide-react";
import { generateWhatsAppTicketLink } from "@/lib/whatsapp";
import { SaveTicketImageButton } from "@/components/save-ticket-image-button";
import { getEventAnnouncements } from "@/lib/data";
import { PastoralBroadcastBanner } from "@/components/pastoral-broadcast-banner";

export const metadata: Metadata = {
  title: "My Ticket | Selah",
};

export default async function TicketViewPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // Find the registration by code
  const results = await db
    .select({
      registration: registrations,
      event: events,
      ticketType: ticketTypes,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(ticketTypes, eq(registrations.ticketTypeId, ticketTypes.id))
    .where(eq(registrations.ticketCode, code))
    .limit(1);

  if (results.length === 0) {
    notFound();
  }

  const { registration, event, ticketType } = results[0];
  const announcements = await getEventAnnouncements(event.id, true);
  const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(registration.ticketCode)}&size=300&margin=1`;

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#fdf8f4] p-4 pt-16 sm:p-8">
      <div className="absolute top-8 left-8">
        <SelahMark />
      </div>

      <div className="w-full max-w-md space-y-4">
        {announcements && announcements.length > 0 && (
          <PastoralBroadcastBanner
            announcements={announcements as any}
            className="rounded-[20px] shadow-sm overflow-hidden"
          />
        )}

        <div className="overflow-hidden rounded-[24px] bg-white shadow-sm border border-[rgba(22,19,17,0.1)]">
        {/* Header Image */}
        <div className="relative h-48 w-full overflow-hidden bg-warm-200 flex items-center justify-center">
          {event.coverImage ? (
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              className="object-cover opacity-80"
              style={{
                objectPosition: (event.media as any[])?.[0]?.focus 
                  ? `${(event.media as any[])[0].focus.x}% ${(event.media as any[])[0].focus.y}%` 
                  : "center"
              }}
            />
          ) : (
            <CalendarDays size={48} className="text-warm-400 opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-cypress/90 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="font-display text-2xl font-semibold text-parchment line-clamp-2">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="p-8 pb-10 text-center">
          <div className="mb-6">
            <p className="text-[0.8125rem] font-medium text-warm-500 uppercase tracking-wider">
              {ticketType.name}
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
              {registration.firstName} {registration.lastName}
            </h2>
            <p className="mt-2 text-[0.95rem] text-warm-500">{registration.email}</p>
          </div>

          {/* Event Status Alert: Cancelled / Postponed Notice */}
          {event.status === "cancelled" && (
            <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-left shadow-xs">
              <div className="flex items-center gap-2 font-bold text-red-800 text-xs sm:text-sm">
                <AlertTriangle size={16} className="text-red-600 shrink-0" />
                <span>Event Cancelled by Organizers</span>
              </div>
              <p className="mt-1.5 text-xs text-red-700 leading-relaxed">
                {event.cancellationReason || "This gathering has been officially cancelled. Your pass is deactivated and check-in scanning is closed."}
              </p>
            </div>
          )}

          {event.status === "postponed" && (
            <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-left shadow-xs">
              <div className="flex items-center gap-2 font-bold text-amber-800 text-xs sm:text-sm">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span>Event Postponed</span>
              </div>
              <p className="mt-1.5 text-xs text-amber-700 leading-relaxed">
                {event.cancellationReason || "This program has been postponed. Your registration remains reserved while new dates are scheduled."}
              </p>
            </div>
          )}

          <div className="mx-auto flex justify-center">
            <div className={`rounded-[16px] border-[2px] p-4 ${event.status === "cancelled" ? "border-red-300 opacity-60 bg-red-50/50" : "border-[rgba(22,19,17,0.1)]"}`}>
              <img src={qrCodeUrl} alt="QR Code" className="h-48 w-48 rounded-[8px]" />
            </div>
          </div>

            <p className="font-mono text-lg font-bold tracking-[0.2em] text-ink">
              {registration.ticketCode}
            </p>
            {registration.isVolunteer && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/35 px-4 py-1.5 text-xs font-bold text-amber-700">
                <span>✨</span>
                <span>VOLUNTEER · {registration.volunteerUnit || "Ministry Team"}</span>
              </div>
            )}
            {registration.tableNumber && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[rgba(192,138,46,0.15)] border border-[rgba(192,138,46,0.3)] px-3.5 py-1 text-xs font-semibold text-[var(--color-brass-deep)]">
                <Utensils size={13} />
                <span>{registration.tableNumber}</span>
                {registration.seatNumber && <span>(Seat {registration.seatNumber})</span>}
              </div>
            )}
            {registration.status === "checked_in" && (
              <span className="mt-3 ml-2 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-[0.8125rem] font-medium text-green-800">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                Checked In
              </span>
            )}
          </div>

          <div className="px-8 pb-8">
            <hr className="mb-6 border-dashed border-[rgba(22,19,17,0.15)]" />

            <div className="grid grid-cols-2 gap-6 text-left">
              <div>
                <p className="text-[0.75rem] font-medium text-warm-400 uppercase tracking-wider">Date & Time</p>
                <p className="mt-1.5 text-[0.95rem] font-medium text-ink">{formatDate(event.startsAt)}</p>
                <p className="mt-0.5 text-[0.875rem] text-warm-500">{formatTime(event.startsAt)}</p>
              </div>
              <div>
                <p className="text-[0.75rem] font-medium text-warm-400 uppercase tracking-wider">Location</p>
                <p className="mt-1.5 text-[0.95rem] font-medium text-ink line-clamp-2">{event.venueName || "TBA"}</p>
              </div>
            </div>
            
            <div className="mt-8 flex flex-col gap-3">
              <a 
                href={`/api/tickets/${registration.ticketCode}/pdf`}
                download
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[0.9rem] font-semibold text-parchment transition-all hover:bg-brass-deep hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Download PDF Ticket
              </a>

              <SaveTicketImageButton
                ticket={{
                  eventTitle: event.title,
                  attendeeName: `${registration.firstName} ${registration.lastName}`,
                  ticketCode: registration.ticketCode,
                  ticketTier: ticketType?.name || registration.attendeeType,
                  qrCodeUrl,
                  dateStr: `${formatDate(event.startsAt)} · ${formatTime(event.startsAt)}`,
                  venueName: event.venueName || event.city,
                  tableNumber: registration.tableNumber,
                  seatNumber: registration.seatNumber,
                  accommodationType: registration.accommodationType,
                }}
              />

              <a
                href={generateWhatsAppTicketLink({
                  phone: registration.phone,
                  eventTitle: event.title,
                  attendeeName: `${registration.firstName} ${registration.lastName}`,
                  ticketCode: registration.ticketCode,
                  ticketTier: ticketType?.name || registration.attendeeType,
                  tableNumber: registration.tableNumber,
                  seatNumber: registration.seatNumber,
                  venueName: event.venueName,
                  eventDate: formatDate(event.startsAt),
                  passUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://selahevent.vercel.app'}/my-tickets/${registration.ticketCode}`,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-500/10 px-6 py-3.5 text-[0.9rem] font-semibold text-emerald-800 transition-all hover:bg-emerald-500/20"
              >
                <MessageSquare size={17} className="text-emerald-600" />
                Save Pass to WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
