import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  events,
  organizations,
  payments,
  registrations,
  ticketTypes,
} from "@/db/schema";

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

  if (ticket && ticket.sold >= ticket.capacity) {
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

  try {
    const [created] = await db
      .insert(registrations)
      .values({
        eventId: event.id,
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
        status: requiresPayment ? "pending" : "confirmed",
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

    return NextResponse.json({
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
        status: requiresPayment
          ? "pending_gateway_not_connected"
          : "not_required",
        message: requiresPayment
          ? "This demo build does not process live charges. The registration has been saved with payment pending, and no card details were collected."
          : null,
      },
    });
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
