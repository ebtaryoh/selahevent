import { NextResponse } from "next/server";
import { db } from "@/db";
import { registrations, events, ticketTypes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { sendTicketConfirmation } from "@/lib/email";
import { enforceRateLimit, getClientAddress, rateLimitHeaders } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > 16 * 1024) {
    return NextResponse.json({ success: false, error: "Request is too large." }, { status: 413 });
  }

  const limit = await enforceRateLimit("my-tickets-ip", getClientAddress(req), 5, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many ticket lookup requests. Please try again later." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(cleanEmail) || cleanEmail.length > 254) {
      return NextResponse.json({ success: true });
    }
    const emailLimit = await enforceRateLimit("my-tickets-email", cleanEmail, 3, 600);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many ticket lookup requests for this email. Please try again later." },
        { status: 429, headers: rateLimitHeaders(emailLimit) },
      );
    }

    // Fetch all registrations for this email
    const userRegistrations = await db
      .select({
        registration: registrations,
        event: events,
        ticketType: ticketTypes,
      })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .innerJoin(ticketTypes, eq(registrations.ticketTypeId, ticketTypes.id))
      .where(eq(registrations.email, cleanEmail))
      .orderBy(desc(registrations.createdAt));

    if (userRegistrations.length === 0) {
      // Return 200 anyway so we don't leak whether an email exists or not
      return NextResponse.json({ success: true });
    }

    // For simplicity in this demo, instead of a summary email, we just resend the ticket 
    // confirmation emails for all tickets they own, or maybe just the most recent ones (future events).
    // Let's resend the ticket email for all of them!
    
    // In a real production app, we would send ONE email: "Here are all your tickets" with links to /my-tickets/[code]
    for (const reg of userRegistrations) {
      await sendTicketConfirmation(cleanEmail, {
        attendeeName: `${reg.registration.firstName} ${reg.registration.lastName}`,
        eventName: reg.event.title,
        ticketName: reg.ticketType.name,
        ticketCode: reg.registration.ticketCode,
        startsAt: new Date(reg.event.startsAt).toLocaleString(),
        venueName: reg.event.venueName || "TBA",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error looking up tickets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
