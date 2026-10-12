import { NextResponse } from "next/server";
import { db } from "@/db";
import { registrations, checkIns, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrganization, requirePermission } from "@/lib/data";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    // Verify volunteer or staff permission
    const actor = await requirePermission("checkin.write").catch(() => null);
    const org = await getOrganization().catch(() => null);

    if (!actor && !org) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      columns: { id: true, title: true, status: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get all confirmed registrations for this event
    const confirmedRegistrations = await db
      .select({
        id: registrations.id,
        ticketCode: registrations.ticketCode,
        firstName: registrations.firstName,
        lastName: registrations.lastName,
        attendeeType: registrations.attendeeType,
        tableNumber: registrations.tableNumber,
        seatNumber: registrations.seatNumber,
      })
      .from(registrations)
      .where(and(eq(registrations.eventId, eventId), eq(registrations.status, "confirmed")));

    // Get all existing check-in registration IDs
    const existingCheckIns = await db
      .select({ registrationId: checkIns.registrationId })
      .from(checkIns)
      .where(eq(checkIns.eventId, eventId));

    const checkedInSet = new Set(existingCheckIns.map((c) => c.registrationId));

    const manifest = confirmedRegistrations.map((reg) => ({
      code: reg.ticketCode,
      name: `${reg.firstName} ${reg.lastName}`,
      tier: reg.attendeeType,
      table: reg.tableNumber || null,
      seat: reg.seatNumber || null,
      checkedIn: checkedInSet.has(reg.id),
    }));

    return NextResponse.json({
      eventId,
      eventTitle: event.title,
      timestamp: new Date().toISOString(),
      count: manifest.length,
      tickets: manifest,
    });
  } catch (error) {
    console.error("[offline-pack] Failed to generate pack:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
