import { and, eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, organizations, payments, registrations, ticketTypes, attendees, ticketReservations } from "@/db/schema";
import { sendTicketConfirmation } from "@/lib/email";
import { enforceRateLimit, getClientAddress, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESERVATION_MINUTES = 15;
const IDEMPOTENCY_MAX_LENGTH = 128;

function randomToken(bytes = 8) {
  return randomBytes(bytes).toString("hex").toUpperCase();
}

function makeCode(prefix: string) {
  return prefix + "-" + randomToken(5);
}

export async function POST(request: Request) {
  const clientAddress = getClientAddress(request);
  const abuseLimit = await enforceRateLimit("registration-ip", clientAddress, 30, 60);
  if (!abuseLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many registration attempts. Please wait a moment and try again." },
      { status: 429, headers: rateLimitHeaders(abuseLimit) },
    );
  }
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "We couldn't read that submission. Please try again." }, { status: 400 });
  }

  const idempotencyKey = String(payload.idempotencyKey ?? "").trim();
  if (idempotencyKey && idempotencyKey.length > IDEMPOTENCY_MAX_LENGTH) {
    return NextResponse.json({ ok: false, error: "Invalid idempotency key." }, { status: 422 });
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
    return NextResponse.json({ ok: false, error: "Please complete the following: " + missing.join(", ") + "." }, { status: 422 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "That email address doesn't look right. Please check and try again." }, { status: 422 });
  }

  const event = await db.select().from(events).where(eq(events.slug, slug)).limit(1).then(r => r[0]);
  if (!event) return NextResponse.json({ ok: false, error: "That event could not be found." }, { status: 404 });

  const now = new Date();
  if (event.registrationOpensAt && now < event.registrationOpensAt) {
    return NextResponse.json({ ok: false, error: "Registration for this event has not opened yet." }, { status: 409 });
  }
  if (event.registrationClosesAt && now > event.registrationClosesAt) {
    return NextResponse.json({ ok: false, error: "Registration for this event is closed." }, { status: 409 });
  }

  const ticketId = typeof payload.ticketTypeId === "string" && payload.ticketTypeId ? payload.ticketTypeId : null;
  const ticket = ticketId
    ? await db.select().from(ticketTypes).where(and(eq(ticketTypes.id, ticketId), eq(ticketTypes.eventId, event.id))).limit(1).then(r => r[0])
    : undefined;

  if (ticketId && !ticket) {
    return NextResponse.json({ ok: false, error: "That ticket type is not available for this event." }, { status: 422 });
  }
  if (ticket && !ticket.isVisible) {
    return NextResponse.json({ ok: false, error: "That ticket type is no longer available." }, { status: 409 });
  }

  if (idempotencyKey) {
    const existingByKey = await db
      .select({ id: registrations.id, code: registrations.code, ticketCode: registrations.ticketCode, status: registrations.status, amount: registrations.amount })
      .from(registrations)
      .where(and(eq(registrations.eventId, event.id), eq(registrations.idempotencyKey, idempotencyKey)))
      .limit(1)
      .then(r => r[0]);

    if (existingByKey) {
      return NextResponse.json({
        ok: true,
        reused: true,
        registration: existingByKey,
      });
    }
  }

  const duplicate = await db
    .select({ id: registrations.id })
    .from(registrations)
    .where(and(eq(registrations.eventId, event.id), eq(registrations.email, email)))
    .limit(1)
    .then(r => r[0]);

  const amount = ticket?.price ?? 0;
  const requiresPayment = amount > 0;
  const reference = (requiresPayment ? "PAYSTACK_" : "FREE_") + randomToken(12);
  const prefix = (event.slug.match(/^[a-z]{2,3}/)?.[0] ?? "EV").slice(0, 3).toUpperCase();
  const code = makeCode(prefix);
  const ticketCode = "TKT-" + randomToken(8);
  const reservationExpiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

  const { getAttendeeSession } = await import("@/lib/attendee");
  const session = await getAttendeeSession();
  let attendeeId = session?.attendeeId ?? null;

  try {
    let result;
    try {
      result = await db.transaction(async tx => {
      if (ticket) {
        await tx.execute(sql`SELECT id FROM ticket_types WHERE id = \${ticket.id} FOR UPDATE`);

        const active = await tx.execute(sql`SELECT COUNT(*)::int AS count FROM ticket_reservations WHERE ticket_type_id = \${ticket.id} AND status = 'reserved' AND expires_at > NOW()`);
        const reservedCount = Number((active.rows[0] as { count: number | string }).count);

        const locked = await tx.select().from(ticketTypes).where(eq(ticketTypes.id, ticket.id)).limit(1).then(r => r[0]);
        if (!locked) throw new Error("TICKET_NOT_FOUND");

        if (locked.capacity > 0 && locked.sold + reservedCount >= locked.capacity) {
          throw new Error("TICKET_CAPACITY");
        }
      }

      const [attendee] = await tx.insert(attendees).values({
        organizationId: event.organizationId,
        email,
        firstName,
        lastName,
        phone: String(payload.phone ?? "").trim(),
        city: String(payload.city ?? "").trim(),
        country: String(payload.country ?? event.country),
      }).onConflictDoUpdate({
        target: [attendees.organizationId, attendees.email],
        set: {
          firstName,
          lastName,
          phone: String(payload.phone ?? "").trim(),
          city: String(payload.city ?? "").trim(),
          country: String(payload.country ?? event.country),
        },
      }).returning();

      attendeeId = attendee.id;

      const [created] = await tx.insert(registrations).values({
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
        attendeeType: String(payload.attendeeType ?? "").trim() || "delegate",
        status: requiresPayment ? "pending" : "confirmed",
        accommodation: payload.accommodation === true,
        transport: payload.transport === true,
        dietary: String(payload.dietary ?? "").trim(),
        emergencyName: String(payload.emergencyName ?? "").trim(),
        emergencyPhone: String(payload.emergencyPhone ?? "").trim(),
        amount,
        source: "event_page",
        customAnswers: (payload.customAnswers as Record<string, string>) ?? {},
        idempotencyKey: idempotencyKey || null,
      }).returning();

      if (!created) throw new Error("REGISTRATION_INSERT_FAILED");

      const [payment] = await tx.insert(payments).values({
        registrationId: created.id,
        eventId: event.id,
        amount,
        currency: event.currency,
        gateway: "paystack",
        gatewayReference: reference,
        status: requiresPayment ? "pending" : "paid",
        verified: !requiresPayment,
        paidAt: requiresPayment ? null : new Date(),
      }).returning();

      if (ticket) {
        await tx.insert(ticketReservations).values({
          ticketTypeId: ticket.id,
          eventId: event.id,
          registrationId: created.id,
          status: requiresPayment ? "reserved" : "confirmed",
          expiresAt: reservationExpiresAt,
        });

        if (!requiresPayment) {
          await tx.update(ticketTypes)
            .set({ sold: sql.raw('"sold" + 1') })
            .where(eq(ticketTypes.id, ticket.id));
        }
      }

      return { created, payment };
      });
    } catch (error) {
      const pgError = error as { code?: string };
      if (idempotencyKey && pgError.code === "23505") {
        const existingByKey = await db
          .select({
            id: registrations.id,
            code: registrations.code,
            ticketCode: registrations.ticketCode,
            status: registrations.status,
            amount: registrations.amount,
            ticketTypeId: registrations.ticketTypeId,
          })
          .from(registrations)
          .where(
            and(
              eq(registrations.eventId, event.id),
              eq(registrations.idempotencyKey, idempotencyKey),
            ),
          )
          .limit(1)
          .then(r => r[0]);

        if (existingByKey) {
          return NextResponse.json({
            ok: true,
            reused: true,
            registration: existingByKey,
          });
        }
      }

      throw error;
    }

    let checkoutUrl: string | null = null;

    if (requiresPayment) {
      const organization = await db.select().from(organizations).where(eq(organizations.id, event.organizationId)).limit(1).then(r => r[0]);
      const secretKey = organization?.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY;

      if (!secretKey) {
        await db.update(payments).set({ status: "failed" }).where(eq(payments.id, result.payment.id));
        if (ticket) await db.update(ticketReservations).set({ status: "released" }).where(eq(ticketReservations.registrationId, result.created.id));
        await db.update(registrations).set({ status: "cancelled" }).where(eq(registrations.id, result.created.id));
        return NextResponse.json({ ok: false, error: "Payment gateway is not configured for this organization." }, { status: 500 });
      }

      const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + secretKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100),
          reference,
          metadata: {
            eventId: event.id,
            registrationId: result.created.id,
            ticketTypeId: ticket?.id ?? null,
          },
          callback_url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") + "/e/" + event.slug + "/wallet",
        }),
      });

      const paystackData = await paystackRes.json().catch(() => null);

      if (!paystackRes.ok || !paystackData?.status || !paystackData?.data?.authorization_url) {
        console.error("Paystack initialization failed:", paystackData);
        await db.update(payments).set({ status: "failed" }).where(eq(payments.id, result.payment.id));
        if (ticket) await db.update(ticketReservations).set({ status: "released" }).where(eq(ticketReservations.registrationId, result.created.id));
        await db.update(registrations).set({ status: "cancelled" }).where(eq(registrations.id, result.created.id));
        return NextResponse.json({ ok: false, error: "Could not initialize payment. Please try again." }, { status: 502 });
      }

      checkoutUrl = paystackData.data.authorization_url;
      if (paystackData.data.reference && paystackData.data.reference !== reference) {
        await db
          .update(payments)
          .set({ gatewayReference: paystackData.data.reference })
          .where(eq(payments.id, result.payment.id));
      }
    }

    if (!requiresPayment) {
      await sendTicketConfirmation(result.created.email, {
        attendeeName: result.created.firstName,
        eventName: event.title,
        ticketName: ticket?.name || "General Admission",
        ticketCode: result.created.ticketCode,
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
    }

    const response = NextResponse.json({
      ok: true,
      registration: {
        code: result.created.code,
        ticketCode: result.created.ticketCode,
        firstName: result.created.firstName,
        lastName: result.created.lastName,
        email: result.created.email,
        status: result.created.status,
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
        checkoutUrl,
        status: requiresPayment ? "pending" : "not_required",
        reservationExpiresAt: requiresPayment ? reservationExpiresAt.toISOString() : null,
      },
    });

    if (session && !session.attendeeId && attendeeId) {
      const { SignJWT } = await import("jose");
      const attendeeSecret = process.env.ATTENDEE_JWT_SECRET;
      if (!attendeeSecret) {
        if (process.env.NODE_ENV === "production") {
          throw new Error("ATTENDEE_JWT_SECRET environment variable is required in production.");
        }
        throw new Error("ATTENDEE_JWT_SECRET is required for attendee sessions.");
      }
      const JWT_SECRET = new TextEncoder().encode(attendeeSecret);
      const token = await new SignJWT({
        email: session.email,
        orgId: session.orgId,
        attendeeId,
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
    if (err instanceof Error && err.message === "TICKET_CAPACITY") {
      return NextResponse.json({ ok: false, error: "That ticket type has just reached capacity. Please choose another ticket type." }, { status: 409 });
    }
    console.error("[selah] registration failed:", err);
    return NextResponse.json({ ok: false, error: "We couldn't save this registration just now. Please try again in a moment." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "selah-registrations" });
}
