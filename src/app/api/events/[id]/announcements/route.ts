import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, eventAnnouncements } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getOrganization, getCurrentUser } from "@/lib/data";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const items = await db
      .select()
      .from(eventAnnouncements)
      .where(eq(eventAnnouncements.eventId, eventId))
      .orderBy(desc(eventAnnouncements.isPinned), desc(eventAnnouncements.createdAt));

    return NextResponse.json({ ok: true, announcements: items });
  } catch (error) {
    console.error("Failed to fetch announcements:", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const org = await getOrganization();
    const user = await getCurrentUser();

    if (!org || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const event = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.organizationId, org.id)))
      .limit(1)
      .then((r) => r[0]);

    if (!event) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, message, type = "announcement", isPinned = true, actionUrl, actionLabel } = body;

    if (!title || !message) {
      return NextResponse.json({ ok: false, error: "Title and message are required" }, { status: 400 });
    }

    const [created] = await db
      .insert(eventAnnouncements)
      .values({
        eventId: event.id,
        title: title.trim(),
        message: message.trim(),
        type,
        isPinned: Boolean(isPinned),
        isActive: true,
        authorName: user.name || "Pastoral Secretariat",
        actionUrl: actionUrl?.trim() || null,
        actionLabel: actionLabel?.trim() || null,
      })
      .returning();

    return NextResponse.json({ ok: true, announcement: created });
  } catch (error) {
    console.error("Failed to create announcement:", error);
    return NextResponse.json({ ok: false, error: "Failed to publish announcement" }, { status: 500 });
  }
}
