import { NextResponse } from "next/server";
import { db } from "@/db";
import { registrations, events, ticketTypes } from "@/db/schema";
import { eq, desc, or, ilike, and, sql } from "drizzle-orm";
import { sendTicketConfirmation } from "@/lib/email";
import { enforceRateLimit, getClientAddress, rateLimitHeaders } from "@/lib/rate-limit";
import { generateWhatsAppTicketLink } from "@/lib/whatsapp";

export async function POST(req: Request) {
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > 16 * 1024) {
    return NextResponse.json({ success: false, error: "Request is too large." }, { status: 413 });
  }

  const limit = await enforceRateLimit("my-tickets-ip", getClientAddress(req), 15, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many ticket lookup requests. Please try again in a few minutes." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  try {
    const body = await req.json();
    const rawQuery = String(body.query || body.email || body.phone || "").trim();
    const eventSlug = body.eventSlug ? String(body.eventSlug).trim() : undefined;

    if (!rawQuery) {
      return NextResponse.json({ success: false, error: "Please enter your email, phone number, or ticket code." }, { status: 400 });
    }

    const isEmail = rawQuery.includes("@");
    const digitsOnly = rawQuery.replace(/\D/g, "");
    const isCode = rawQuery.toUpperCase().startsWith("TKT-") || rawQuery.toUpperCase().startsWith("REG-");

    // Build search conditions
    const searchConditions = [];

    if (isEmail) {
      searchConditions.push(ilike(registrations.email, rawQuery.toLowerCase()));
    } else if (isCode) {
      searchConditions.push(
        or(
          eq(registrations.ticketCode, rawQuery.toUpperCase()),
          eq(registrations.code, rawQuery.toUpperCase())
        )
      );
    } else {
      // General text or phone number
      if (digitsOnly.length >= 7) {
        // Last 7 to 10 digits to match phone variations (+234803... vs 0803...)
        const phoneSuffix = digitsOnly.slice(-8);
        searchConditions.push(ilike(registrations.phone, `%${phoneSuffix}%`));
        searchConditions.push(
          sql`regexp_replace(${registrations.phone}, '[^0-9]', '', 'g') ILIKE ${'%' + phoneSuffix + '%'}`
        );
      }
      searchConditions.push(ilike(registrations.email, `%${rawQuery.toLowerCase()}%`));
      searchConditions.push(eq(registrations.ticketCode, rawQuery.toUpperCase()));
    }

    let whereClause = or(...searchConditions);

    if (eventSlug) {
      whereClause = and(whereClause, eq(events.slug, eventSlug));
    }

    // Fetch matching registrations
    const userRegistrations = await db
      .select({
        registration: registrations,
        event: events,
        ticketType: ticketTypes,
      })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .leftJoin(ticketTypes, eq(registrations.ticketTypeId, ticketTypes.id))
      .where(whereClause)
      .orderBy(desc(registrations.createdAt))
      .limit(10);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://selahevent.vercel.app";

    const tickets = userRegistrations.map((item) => {
      const reg = item.registration;
      const evt = item.event;
      const tkt = item.ticketType;
      const passUrl = `${siteUrl}/my-tickets/${reg.ticketCode}`;

      const whatsappUrl = generateWhatsAppTicketLink({
        phone: reg.phone,
        eventTitle: evt.title,
        attendeeName: `${reg.firstName} ${reg.lastName}`,
        ticketCode: reg.ticketCode,
        ticketTier: tkt?.name || "General Admission",
        tableNumber: reg.tableNumber,
        seatNumber: reg.seatNumber,
        venueName: evt.venueName,
        eventDate: evt.startsAt ? new Date(evt.startsAt).toLocaleDateString() : undefined,
        passUrl,
      });

      return {
        id: reg.id,
        ticketCode: reg.ticketCode,
        code: reg.code,
        firstName: reg.firstName,
        lastName: reg.lastName,
        email: reg.email,
        phone: reg.phone,
        status: reg.status,
        eventTitle: evt.title,
        eventSlug: evt.slug,
        eventStartsAt: evt.startsAt ? evt.startsAt.toISOString() : null,
        eventVenue: evt.venueName || "Venue Announced on Pass",
        eventCity: evt.city,
        coverImage: evt.coverImage,
        ticketName: tkt?.name || "General Admission",
        tableNumber: reg.tableNumber,
        seatNumber: reg.seatNumber,
        accommodation: reg.accommodation,
        accommodationType: reg.accommodationType,
        gender: reg.gender,
        isVolunteer: reg.isVolunteer,
        volunteerUnit: reg.volunteerUnit,
        volunteerNotes: reg.volunteerNotes,
        qrCodeUrl: `https://quickchart.io/qr?text=${encodeURIComponent(reg.ticketCode)}&size=300&margin=1`,
        passUrl,
        pdfUrl: `/api/tickets/${reg.ticketCode}/pdf`,
        whatsappUrl,
      };
    });

    // If an email was queried and matches found, trigger background email resend
    if (isEmail && tickets.length > 0) {
      for (const t of tickets.slice(0, 3)) {
        void sendTicketConfirmation(t.email, {
          attendeeName: `${t.firstName} ${t.lastName}`,
          eventName: t.eventTitle,
          ticketName: t.ticketName,
          ticketCode: t.ticketCode,
          startsAt: t.eventStartsAt ? new Date(t.eventStartsAt).toLocaleString() : "TBA",
          venueName: t.eventVenue,
        }).catch(() => null);
      }
    }

    return NextResponse.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Error looking up tickets:", error);
    return NextResponse.json({ success: false, error: "Internal server error looking up tickets" }, { status: 500 });
  }
}
