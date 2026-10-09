import { NextResponse } from "next/server";
import { db } from "@/db";
import { registrations, checkIns, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrganization, requirePermission } from "@/lib/data";
import { enforceRateLimit, getClientAddress, rateLimitHeaders } from "@/lib/rate-limit";
import { createHmac } from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();
    const { ticketId, magicToken } = body;

    let actor = null;
    let isMagic = false;

    // Verify magic token if provided
    if (magicToken) {
      const expectedToken = createHmac("sha256", process.env.AUTH_SECRET || "default_secret")
        .update(eventId)
        .digest("hex");
      
      if (magicToken === expectedToken) {
        isMagic = true;
        actor = { id: null, name: "Volunteer (Magic Link)" };
      } else {
        return NextResponse.json({ error: "Invalid or expired scanner link." }, { status: 401 });
      }
    } else {
      // Fallback to normal session auth
      actor = await requirePermission("checkin.write");
      const org = await getOrganization();
      if (!actor || !org) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const scanLimit = await enforceRateLimit("scanner-ip", getClientAddress(req), 120, 60);
    if (!scanLimit.allowed) {
      return NextResponse.json(
        { error: "Too many scan attempts. Please slow down." },
        { status: 429, headers: rateLimitHeaders(scanLimit) },
      );
    }

    if (!ticketId) {
      return NextResponse.json({ error: "No ticket code provided" }, { status: 400 });
    }

    let event;
    if (isMagic) {
      event = await db.query.events.findFirst({
        where: eq(events.id, eventId),
        columns: { id: true },
      });
    } else {
      const org = await getOrganization();
      event = await db.query.events.findFirst({
        where: and(eq(events.id, eventId), eq(events.organizationId, org!.id)),
        columns: { id: true },
      });
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 1. Find the registration
    const registration = await db
      .select()
      .from(registrations)
      .where(and(eq(registrations.eventId, eventId), eq(registrations.ticketCode, ticketId), eq(registrations.status, "confirmed")))
      .limit(1)
      .then(res => res[0]);

    if (!registration) {
      return NextResponse.json({ error: "Invalid ticket for this event" }, { status: 404 });
    }

    // 2. Check if already checked in (Optional: you might allow multiple scans, but usually it's once per event)
    const existingCheckIn = await db
      .select()
      .from(checkIns)
      .where(and(eq(checkIns.eventId, eventId), eq(checkIns.registrationId, registration.id)))
      .limit(1)
      .then(res => res[0]);

    if (existingCheckIn) {
      return NextResponse.json({ error: "Ticket has already been scanned!" }, { status: 400 });
    }

    // 3. Mark as checked in
    try {
      await db.insert(checkIns).values({
        eventId,
        registrationId: registration.id,
        method: "qr",
        staffName: actor.name || "QR Scanner User",
        gate: "Main Entrance",
        scannedBy: actor.id,
      });
    } catch (error) {
      const pgError = error as { code?: string };
      if (pgError.code === "23505") {
        return NextResponse.json({ error: "Ticket has already been scanned!" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      attendeeName: `${registration.firstName} ${registration.lastName}`,
      ticketType: registration.attendeeType,
    });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
