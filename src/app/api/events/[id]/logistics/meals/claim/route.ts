import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, eventMealPasses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrganization, getCurrentUser } from "@/lib/data";

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

    if (!event) return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });

    const body = await req.json();
    const { voucherCode } = body;

    if (!voucherCode) {
      return NextResponse.json({ ok: false, error: "Voucher code is required" }, { status: 400 });
    }

    const pass = await db
      .select()
      .from(eventMealPasses)
      .where(
        and(
          eq(eventMealPasses.eventId, eventId),
          eq(eventMealPasses.voucherCode, String(voucherCode).trim().toUpperCase())
        )
      )
      .limit(1)
      .then((r) => r[0]);

    if (!pass) {
      return NextResponse.json({ ok: false, error: "Invalid meal voucher code" }, { status: 404 });
    }

    if (pass.isClaimed) {
      return NextResponse.json(
        {
          ok: false,
          error: `Meal already served on ${new Date(pass.claimedAt!).toLocaleTimeString()} by ${pass.claimedByStaff || "Catering Team"}.`,
          pass,
        },
        { status: 409 }
      );
    }

    const [updated] = await db
      .update(eventMealPasses)
      .set({
        isClaimed: true,
        claimedAt: new Date(),
        claimedByStaff: user.name || "Catering Usher",
      })
      .where(eq(eventMealPasses.id, pass.id))
      .returning();

    return NextResponse.json({
      ok: true,
      message: `Successfully verified ${updated.mealType.toUpperCase()} pass for ${updated.attendeeName}!`,
      pass: updated,
    });
  } catch (error) {
    console.error("Failed to verify meal voucher:", error);
    return NextResponse.json({ ok: false, error: "Failed to verify voucher" }, { status: 500 });
  }
}
