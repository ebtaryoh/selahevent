import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  events,
  organizations,
  payments,
  registrations,
  ticketTypes,
  attendees,
} from "@/db/schema";
import { sendTicketConfirmation } from "@/lib/email";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function randomToken(length = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "We couldn't read that submission. Please try again." },
      { status: 400 }
    );
  }

  const slug = String(payload.eventSlug ?? "").trim();
  const firstName = String(payload.firstName ?? "").trim();
  const lastName = String(payload.lastName ?? "").trim();
  const email = String(payload.email ?? "").trim().toLowerCase();

  const missing: string[] = [];
  if (!slug) missing.push("event");
  if (!firstName) missing.push("first name");
  if (!lastName) missing.push("last name");
  if (!email) missing.push("email address");

  if (missing.length) {
    return NextResponse.json(
      {
        ok: false,
        error: `Please complete the following: ${missing.join(", ")}.`,
      },
      { status: 422 }
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      {
        ok: false,
        error: "That email address doesn't look right. Please check and try again.",
      },
      { status: 422 }
    );
  }

  const event = await db
    .select()
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1)
    .then((r) => r[0]);

  if (!event) {
    return NextResponse.json(
      { ok: false, error: "That event could not be found." },
      { status: 404 }
    );
  }

  const ticketIdRaw = payload.ticketTypeId;
  const ticket =
    typeof ticketIdRaw === "string" && ticketIdRaw
      ? await db
          .select()
          .from(ticketTypes)
          .where(eq(ticketTypes.id, ticketIdRaw))
          .limit(1)
          .then((r) => r[0])
      : undefined;

  if (ticket && ticket.capacity > 0 && ticket.sold >= ticket.capacity) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "That ticket type has just reached capacity. Please choose another ticket type.",
      },
      { status: 409 }
    );
  }

  const duplicate = await db
    .select({ id: registrations.id })
    .from(registrations)
    .where(eq(registrations.email, email))
    .limit(1)
    .then((r) => r[0]);

  const prefix = (event.slug.match(/^[a-z]{2,3}/)?.[0] ?? "ev")
    .slice(0, 3)
    .toUpperCase();

  const sequence = Math.floor(Math.random() * 9000) + 1000;
  const code = `${prefix.toUpperCase()}27-${sequence}`;
  const ticketCode = `TKT-${randomToken(6)}-${sequence}`;

  const amount = ticket?.price ?? 0;
  const requiresPayment = amount > 0;

  const { getAttendeeSession } = await import("@/lib/attendee");
  const session = await getAttendeeSession();
  let attendeeId = session?.attendeeId ?? null;

  try {
    const [attendee] = await db
      .insert(attendees)
      .values({
        organizationId: event.organizationId,
        email,
        firstName,
        lastName,
        phone: String(payload.phone ?? "").trim(),
        city: String(payload.city ?? "").trim(),
        country: String(payload.country ?? event.country),
      })
      .onConflictDoUpdate({
        target: [attendees.organizationId, attendees.email],
        set: {
          firstName,
          lastName,
          phone: String(payload.phone ?? "").trim(),
          city: String(payload.city ?? "").trim(),
          country: String(payload.country ?? event.country),
        },
      })
      .returning();
    
    attendeeId = attendee.id;

    // TODO: Ideally we should update the JWT here to include the attendeeId if it was null,
    // but the Next.js App Router doesn't allow setting cookies directly in an API Route unless using NextResponse.
    // We will do it below by adding to the response cookies.

    const [created] = await db
      .insert(registrations)
      .values({
        eventId: event.id,
        attendeeId,
        ticketTypeId: ticket?.id ?? null,
        code,
        ticketCode,
        firstName,
        lastName,
        email,
        phone: String(payload.phone ?? "").trim(),
        city: String(payload.city ?? "").trim(),
        country: String(payload.country ?? event.country),
        church: String(payload.church ?? "").trim(),
        attendeeType:
          String(payload.attendeeType ?? "").trim() || "delegate",
        status: ticket?.requiresApproval
          ? "under_review"
          : requiresPayment 
            ? "pending" 
            : "confirmed",
        accommodation: payload.accommodation === true,
        transport: payload.transport === true,
        dietary: String(payload.dietary ?? "").trim(),
        emergencyName: String(payload.emergencyName ?? "").trim(),
        emergencyPhone: String(payload.emergencyPhone ?? "").trim(),
        amount,
        source: "event_page",
        customAnswers: (payload.customAnswers as Record<string, string>) ?? {},
      })
      .returning();

    if (!created) {
      throw new Error("insert returned no row");
    }

    await db.insert(payments).values({
      registrationId: created.id,
      eventId: event.id,
      amount,
      currency: event.currency,
      gateway: "paystack",
      gatewayReference: requiresPayment
        ? `PENDING_${randomToken(10)}`
        : `FREE_${randomToken(10)}`,
      status: requiresPayment ? "pending" : "paid",
      verified: !requiresPayment,
      paidAt: requiresPayment ? null : new Date(),
    });

    if (ticket) {
      await db
        .update(ticketTypes)
        .set({ sold: ticket.sold + 1 })
        .where(eq(ticketTypes.id, ticket.id));
    }

    // Send ticket confirmation email
    void sendTicketConfirmation(created.email, {
      attendeeName: created.firstName,
      eventName: event.title,
      ticketName: ticket?.name || "General Admission",
      ticketCode: created.ticketCode,
      startsAt: new Date(event.startsAt).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      }),
      venueName: event.venueName || event.city || "Virtual Event",
    });

    const response = NextResponse.json({
      ok: true,
      registration: {
        code: created.code,
        ticketCode: created.ticketCode,
        firstName: created.firstName,
        lastName: created.lastName,
        email: created.email,
        status: created.status,
        amount,
        currency: event.currency,
      },
      event: {
        title: event.title,
        slug: event.slug,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        city: event.city,
      },
      duplicateLikely: Boolean(duplicate),
      payment: {
        required: requiresPayment,
        status: ticket?.requiresApproval
          ? "under_review"
          : requiresPayment
          ? "pending_gateway_not_connected"
          : "not_required",
        message: ticket?.requiresApproval
          ? "This ticket requires approval. You will receive an email once it is approved."
          : requiresPayment
          ? "This demo build does not process live charges. The registration has been saved with payment pending, and no card details were collected."
          : null,
      },
    });

    if (session && !session.attendeeId && attendeeId) {
      const { SignJWT } = await import("jose");
      const JWT_SECRET = new TextEncoder().encode(
        process.env.JWT_SECRET || "super-secret-attendee-key-change-in-prod"
      );
      const token = await new SignJWT({ 
        email: session.email,
        orgId: session.orgId,
        attendeeId: attendeeId 
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(JWT_SECRET);
        
      response.cookies.set("attendee_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }

    return response;
  } catch (err) {
    console.error("[selah] registration failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          "We couldn't save this registration just now. Nothing was charged — please try again in a moment.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const org = await db.select().from(organizations).limit(1);
  return NextResponse.json({
    ok: true,
    service: "selah-registrations",
    tenant: org[0]?.slug ?? null,
  });
}
