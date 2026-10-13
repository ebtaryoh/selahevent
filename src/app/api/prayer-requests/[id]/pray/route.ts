import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prayerRequests } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing prayer ID." }, { status: 400 });
    }

    const [updated] = await db
      .update(prayerRequests)
      .set({
        prayerCount: sql`${prayerRequests.prayerCount} + 1`,
      })
      .where(eq(prayerRequests.id, id))
      .returning({
        id: prayerRequests.id,
        prayerCount: prayerRequests.prayerCount,
      });

    if (!updated) {
      return NextResponse.json({ ok: false, error: "Prayer request not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, prayerCount: updated.prayerCount });
  } catch (error) {
    console.error("[selah-prayers] pray error:", error);
    return NextResponse.json({ ok: false, error: "Failed to record prayer." }, { status: 500 });
  }
}
