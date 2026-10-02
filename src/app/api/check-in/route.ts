import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { getOrganization } from "@/lib/data";
import { checkIns, events, registrations, ticketTypes } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const eventId = String(payload.eventId ?? "").trim();
  const rawCode = String(payload.ticketCode ?? "").trim().toUpperCase();
  const staffName =
    String(payload.staffName ?? "").trim() || "Command Center";
  const gate = String(payload.gate ?? "").trim() || "Main entrance";

  if (!eventId || !rawCode) {
    return NextResponse.json(
      { ok: false, error: "An event and a ticket code are required." },
      { status: 422 }
    );
  }

  // Check-in is an organizer operation. The event must belong to the authenticated organization.
  const org = await getOrganization();
  if (!org) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 }
    );
  }

  const event = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.organizationId, org.id)))
    .limit(1)
    .then((r) => r[0]);

  if (!event) {
    return NextResponse.json(
      { ok: false, error: "Event not found." },
      { status: 404 }
    );
  }

  const attendee = await db
    .select({
      registration: registrations,
      ticketName: ticketTypes.name,
    })
    .from(registrations)
    .leftJoin(
      ticketTypes,
      eq(registrations.ticketTypeId, ticketTypes.id)
    )
    .where(
      and(
        eq(registrations.eventId, eventId),
        eq(registrations.ticketCode, rawCode)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (!attendee) {
    return NextResponse.json(
      {
        ok: false,
        status: "not_found",
        error: `No registration matches “${rawCode}” for this event.`,
      },
      { status: 404 }
    );
  }

  const existing = await db
    .select()
    .from(checkIns)
    .where(
      and(
        eq(checkIns.eventId, eventId),
        eq(checkIns.registrationId, attendee.registration.id)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (existing) {
    return NextResponse.json({
      ok: true,
      status: "already_checked_in",
      attendee: {
        firstName: attendee.registration.firstName,
        lastName: attendee.registration.lastName,
        ticketCode: attendee.registration.ticketCode,
        ticketName: attendee.ticketName ?? "General admission",
        city: attendee.registration.city,
      },
      checkedInAt: existing.checkedInAt,
      gate: existing.gate,
      staffName: existing.staffName,
    });
  }

  if (attendee.registration.status === "cancelled") {
    return NextResponse.json(
      {
        ok: false,
        status: "cancelled",
        error: "This registration has been cancelled and cannot be checked in.",
        attendee: {
          firstName: attendee.registration.firstName,
          lastName: attendee.registration.lastName,
          ticketCode: attendee.registration.ticketCode,
        },
      },
      { status: 409 }
    );
  }

  const [record] = await db
    .insert(checkIns)
    .values({
      eventId,
      registrationId: attendee.registration.id,
      method: String(payload.method ?? "qr") === "manual" ? "manual" : "qr",
      staffName,
      gate,
    })
    .returning();

  return NextResponse.json({
    ok: true,
    status: "checked_in",
    attendee: {
      firstName: attendee.registration.firstName,
      lastName: attendee.registration.lastName,
      ticketCode: attendee.registration.ticketCode,
      ticketName: attendee.ticketName ?? "General admission",
      city: attendee.registration.city,
      accommodation: attendee.registration.accommodation,
      transport: attendee.registration.transport,
    },
    checkedInAt: record?.checkedInAt ?? new Date(),
    gate,
    staffName,
  });
}
