import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, eventAnnouncements } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrganization } from "@/lib/data";
import { revalidatePath } from "next/cache";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const { id: eventId, announcementId } = await params;
    const org = await getOrganization();
    if (!org) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const event = await db.query.events.findFirst({
      where: and(eq(events.id, eventId), eq(events.organizationId, org.id)),
      columns: { id: true, slug: true },
    });

    const body = await req.json();
    const [updated] = await db
      .update(eventAnnouncements)
      .set(body)
      .where(and(eq(eventAnnouncements.id, announcementId), eq(eventAnnouncements.eventId, eventId)))
      .returning();

    if (event) {
      revalidatePath(`/e/${event.slug}`);
      revalidatePath(`/e/${event.slug}/wallet`);
    }
    revalidatePath(`/my-tickets`);
    revalidatePath(`/dashboard/events/${eventId}/broadcasts`);

    return NextResponse.json({ ok: true, announcement: updated });
  } catch (error: any) {
    console.error("Failed to update announcement:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const { id: eventId, announcementId } = await params;
    const org = await getOrganization();
    if (!org) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const event = await db.query.events.findFirst({
      where: and(eq(events.id, eventId), eq(events.organizationId, org.id)),
      columns: { id: true, slug: true },
    });

    await db
      .delete(eventAnnouncements)
      .where(and(eq(eventAnnouncements.id, announcementId), eq(eventAnnouncements.eventId, eventId)));

    if (event) {
      revalidatePath(`/e/${event.slug}`);
      revalidatePath(`/e/${event.slug}/wallet`);
    }
    revalidatePath(`/my-tickets`);
    revalidatePath(`/dashboard/events/${eventId}/broadcasts`);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Failed to delete announcement:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to delete" }, { status: 500 });
  }
}
