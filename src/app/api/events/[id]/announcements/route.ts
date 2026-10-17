import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, eventAnnouncements } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getOrganization, getCurrentUser } from "@/lib/data";
import { revalidatePath } from "next/cache";

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
    if (!org) {
      return NextResponse.json({ ok: false, error: "Unauthorized: Please sign in as an organizer." }, { status: 401 });
    }

    const user = await getCurrentUser().catch(() => null);

    const event = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.organizationId, org.id)))
      .limit(1)
      .then((r) => r[0]);

    if (!event) {
      return NextResponse.json({ ok: false, error: "Event not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const { title, message, type = "announcement", isPinned = true, actionUrl, actionLabel } = body;

    if (!title || !message) {
      return NextResponse.json({ ok: false, error: "Title and message are required" }, { status: 400 });
    }

    const authorName = user?.name || org.name || "Pastoral Secretariat";

    const [created] = await db
      .insert(eventAnnouncements)
      .values({
        eventId: event.id,
        title: title.trim(),
        message: message.trim(),
        type,
        isPinned: Boolean(isPinned),
        isActive: true,
        authorName,
        actionUrl: actionUrl?.trim() || null,
        actionLabel: actionLabel?.trim() || null,
      })
      .returning();

    revalidatePath(`/e/${event.slug}`);
    revalidatePath(`/e/${event.slug}/wallet`);
    revalidatePath(`/my-tickets`);
    revalidatePath(`/dashboard/events/${eventId}/broadcasts`);

    return NextResponse.json({ ok: true, announcement: created });
  } catch (error: any) {
    console.error("Failed to create announcement:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to publish announcement" }, { status: 500 });
  }
}
