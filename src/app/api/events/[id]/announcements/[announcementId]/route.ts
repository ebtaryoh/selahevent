import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, eventAnnouncements } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrganization, getCurrentUser } from "@/lib/data";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const { id: eventId, announcementId } = await params;
    const org = await getOrganization();
    if (!org) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const [updated] = await db
      .update(eventAnnouncements)
      .set(body)
      .where(and(eq(eventAnnouncements.id, announcementId), eq(eventAnnouncements.eventId, eventId)))
      .returning();

    return NextResponse.json({ ok: true, announcement: updated });
  } catch (error) {
    console.error("Failed to update announcement:", error);
    return NextResponse.json({ ok: false, error: "Failed to update" }, { status: 500 });
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

    await db
      .delete(eventAnnouncements)
      .where(and(eq(eventAnnouncements.id, announcementId), eq(eventAnnouncements.eventId, eventId)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete announcement:", error);
    return NextResponse.json({ ok: false, error: "Failed to delete" }, { status: 500 });
  }
}
