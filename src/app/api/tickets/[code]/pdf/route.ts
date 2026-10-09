import { NextResponse } from "next/server";
import { db } from "@/db";
import { registrations, events, ticketTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateTicketPdf } from "@/lib/pdf-ticket";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

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
    return new NextResponse("Not Found", { status: 404 });
  }

  const { registration, event, ticketType } = results[0];

  const startsAtFormatted = new Date(event.startsAt).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
  
  const venueFormatted = event.venueName || event.city || "Virtual Event";

  const pdfBuffer = await generateTicketPdf(
    registration.code,
    registration.ticketCode,
    `${registration.firstName} ${registration.lastName}`,
    event.title,
    startsAtFormatted,
    venueFormatted,
    ticketType.name
  );

  return new NextResponse(pdfBuffer as any, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ticket-${registration.ticketCode}.pdf"`,
    },
  });
}
