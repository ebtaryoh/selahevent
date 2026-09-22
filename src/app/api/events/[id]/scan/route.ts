import { NextResponse } from "next/server";
import { db } from "@/db";
import { registrations, checkIns } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrgSession } from "@/lib/session";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getOrgSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await req.json();
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "No ticket code provided" }, { status: 400 });
    }

    // 1. Find the registration
    const registration = await db
      .select()
      .from(registrations)
      .where(and(eq(registrations.eventId, eventId), eq(registrations.ticketCode, ticketId)))
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
    await db.insert(checkIns).values({
      eventId,
      registrationId: registration.id,
      method: "qr",
      staffName: "QR Scanner User",
      gate: "Main Entrance",
    });

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
