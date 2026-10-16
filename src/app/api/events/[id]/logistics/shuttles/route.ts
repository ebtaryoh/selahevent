import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, eventShuttles, attendeeShuttleBookings } from "@/db/schema";
import { eq, and, sql, asc } from "drizzle-orm";
import { getOrganization } from "@/lib/data";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const shuttles = await db
      .select()
      .from(eventShuttles)
      .where(eq(eventShuttles.eventId, eventId))
      .orderBy(asc(eventShuttles.routeTitle));

    return NextResponse.json({ ok: true, shuttles });
  } catch (error) {
    console.error("Failed to fetch shuttles:", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch shuttles" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();

    // Check if this is an attendee booking a seat
    if (body.action === "book_seat") {
      const { shuttleId, attendeeName, attendeeEmail, attendeePhone, seatCount = 1 } = body;

      if (!shuttleId || !attendeeName || !attendeeEmail) {
        return NextResponse.json({ ok: false, error: "Name, email, and shuttle are required" }, { status: 400 });
      }

      const shuttle = await db
        .select()
        .from(eventShuttles)
        .where(and(eq(eventShuttles.id, shuttleId), eq(eventShuttles.eventId, eventId)))
        .limit(1)
        .then((r) => r[0]);

      if (!shuttle) {
        return NextResponse.json({ ok: false, error: "Shuttle route not found" }, { status: 404 });
      }

      if (shuttle.totalSeats > 0 && shuttle.bookedSeats + seatCount > shuttle.totalSeats) {
        return NextResponse.json({ ok: false, error: "This shuttle is currently fully booked." }, { status: 409 });
      }

      const bookingCode = `BUS-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      const [booking] = await db
        .insert(attendeeShuttleBookings)
        .values({
          eventId,
          shuttleId,
          attendeeName: attendeeName.trim(),
          attendeeEmail: attendeeEmail.trim().toLowerCase(),
          attendeePhone: attendeePhone?.trim() || "",
          seatCount: Number(seatCount) || 1,
          bookingCode,
          boardingStatus: "confirmed",
        })
        .returning();

      // Increment booked seats
      await db
        .update(eventShuttles)
        .set({ bookedSeats: sql`${eventShuttles.bookedSeats} + ${seatCount}` })
        .where(eq(eventShuttles.id, shuttleId));

      return NextResponse.json({
        ok: true,
        message: "Seat reservation confirmed!",
        booking,
      });
    }

    // Otherwise, organizer creating a new shuttle route
    const org = await getOrganization();
    if (!org) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const event = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.organizationId, org.id)))
      .limit(1)
      .then((r) => r[0]);

    if (!event) return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });

    const {
      routeTitle,
      pickupLocation,
      departureTime,
      returnTime = "",
      busCaptainName = "Transport Coordinator",
      busCaptainPhone = "",
      totalSeats = 50,
      fare = 0,
      instructions = "Please arrive 15 minutes before departure.",
    } = body;

    if (!routeTitle || !pickupLocation || !departureTime) {
      return NextResponse.json({ ok: false, error: "Route title, pickup location, and departure time are required" }, { status: 400 });
    }

    const [created] = await db
      .insert(eventShuttles)
      .values({
        eventId: event.id,
        routeTitle: routeTitle.trim(),
        pickupLocation: pickupLocation.trim(),
        departureTime: departureTime.trim(),
        returnTime: returnTime.trim(),
        busCaptainName: busCaptainName.trim(),
        busCaptainPhone: busCaptainPhone.trim(),
        totalSeats: Number(totalSeats) || 50,
        bookedSeats: 0,
        fare: Number(fare) || 0,
        instructions: instructions.trim(),
        isActive: true,
      })
      .returning();

    return NextResponse.json({ ok: true, shuttle: created });
  } catch (error) {
    console.error("Failed to process shuttle request:", error);
    return NextResponse.json({ ok: false, error: "Failed to process request" }, { status: 500 });
  }
}
