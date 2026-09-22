import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { registrations, events, ticketTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SelahMark } from "@/components/logo";
import { formatDate, formatTime } from "@/lib/format";
import Image from "next/image";
import { CalendarDays } from "lucide-react";

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
  const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(registration.ticketCode)}&size=300&margin=1`;

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#fdf8f4] p-4 pt-16 sm:p-8">
      <div className="absolute top-8 left-8">
        <SelahMark />
      </div>

      <div className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-sm border border-[rgba(22,19,17,0.1)]">
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
          <div className="mb-8">
            <p className="text-[0.8125rem] font-medium text-warm-500 uppercase tracking-wider">
              {ticketType.name}
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
              {registration.firstName} {registration.lastName}
            </h2>
            <p className="mt-2 text-[0.95rem] text-warm-500">{registration.email}</p>
          </div>

          <div className="mx-auto flex justify-center">
            <div className="rounded-[16px] border-[2px] border-[rgba(22,19,17,0.1)] p-4">
              <img src={qrCodeUrl} alt="QR Code" className="h-48 w-48 rounded-[8px]" />
            </div>
          </div>

          <div className="mt-6">
            <p className="font-mono text-lg font-bold tracking-[0.2em] text-ink">
              {registration.ticketCode}
            </p>
            {registration.status === "checked_in" && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-[0.8125rem] font-medium text-green-800">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                Checked In
              </span>
            )}
          </div>

          <hr className="my-8 border-dashed border-[rgba(22,19,17,0.15)]" />

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
        </div>
      </div>
    </div>
  );
}
