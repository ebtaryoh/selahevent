import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, eventAccommodations, attendeeAccommodations } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getOrganization } from "@/lib/data";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const accommodations = await db
      .select()
      .from(eventAccommodations)
      .where(eq(eventAccommodations.eventId, eventId))
      .orderBy(asc(eventAccommodations.name));

    return NextResponse.json({ ok: true, accommodations });
  } catch (error) {
    console.error("Failed to fetch accommodations:", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const org = await getOrganization();
    if (!org) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const event = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.organizationId, org.id)))
      .limit(1)
      .then((r) => r[0]);

    if (!event) return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });

    const body = await req.json();
    const { name, category = "general", location = "", totalBeds = 50, checkInInstructions } = body;

    if (!name) return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });

    const [created] = await db
      .insert(eventAccommodations)
      .values({
        eventId: event.id,
        name: name.trim(),
        category,
        location: location.trim(),
        totalBeds: Number(totalBeds) || 50,
        allocatedBeds: 0,
        checkInInstructions: checkInInstructions?.trim() || "Present your digital camp pass at the Accommodation Secretariat.",
        isActive: true,
      })
      .returning();

    return NextResponse.json({ ok: true, accommodation: created });
  } catch (error) {
    console.error("Failed to create accommodation:", error);
    return NextResponse.json({ ok: false, error: "Failed to create" }, { status: 500 });
  }
}
