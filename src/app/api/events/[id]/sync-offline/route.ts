import { NextResponse } from "next/server";
import { db } from "@/db";
import { registrations, checkIns, events } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getOrganization, requirePermission } from "@/lib/data";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();
    const { scans } = body as { scans: Array<{ ticketCode: string; timestamp?: string }> };

    if (!Array.isArray(scans) || scans.length === 0) {
      return NextResponse.json({ message: "No scans to sync", syncedCount: 0 });
    }

    const actor = await requirePermission("checkin.write").catch(() => null);
    const org = await getOrganization().catch(() => null);
    if (!actor && !org) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cleanCodes = scans.map((s) => s.ticketCode.trim().toUpperCase());

    // Find registrations for these codes
    const foundRegistrations = await db
      .select({
        id: registrations.id,
        ticketCode: registrations.ticketCode,
      })
      .from(registrations)
      .where(and(eq(registrations.eventId, eventId), inArray(registrations.ticketCode, cleanCodes)));

    let syncedCount = 0;
    const staffName = actor ? actor.name || "Offline Kiosk" : "Offline Kiosk";

    for (const reg of foundRegistrations) {
      const alreadyCheckedIn = await db
        .select({ id: checkIns.id })
        .from(checkIns)
        .where(and(eq(checkIns.eventId, eventId), eq(checkIns.registrationId, reg.id)))
        .limit(1)
        .then((r) => r[0]);

      if (!alreadyCheckedIn) {
        await db.insert(checkIns).values({
          eventId,
          registrationId: reg.id,
          method: "offline_sync",
          staffName,
          gate: "Turnstile / Offline Scanner",
          scannedBy: actor ? actor.id : null,
        });
        syncedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      totalReceived: scans.length,
    });
  } catch (error) {
    console.error("[sync-offline] Failed to sync offline scans:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
