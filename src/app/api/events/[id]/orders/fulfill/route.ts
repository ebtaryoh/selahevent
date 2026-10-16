import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, orderItems } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
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

    if (!event) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    const body = await req.json();
    const { voucherCode, orderItemId } = body;

    if (!voucherCode && !orderItemId) {
      return NextResponse.json(
        { ok: false, error: "Voucher code or Order Item ID is required." },
        { status: 400 }
      );
    }

    const conditions = [eq(orderItems.eventId, event.id)];
    if (voucherCode) {
      conditions.push(eq(orderItems.pickupVoucherCode, String(voucherCode).trim().toUpperCase()));
    } else if (orderItemId) {
      conditions.push(eq(orderItems.id, orderItemId));
    }

    const targetItem = await db
      .select()
      .from(orderItems)
      .where(and(...conditions))
      .limit(1)
      .then((r) => r[0]);

    if (!targetItem) {
      return NextResponse.json(
        { ok: false, error: "No matching order found with that voucher code." },
        { status: 404 }
      );
    }

    if (targetItem.fulfillmentStatus === "collected") {
      return NextResponse.json({
        ok: false,
        error: `Already collected on ${new Date(targetItem.collectedAt!).toLocaleString()} by staff "${targetItem.collectedByStaffName || "Resource Desk"}".`,
        orderItem: targetItem,
      }, { status: 409 });
    }

    const staffName = user.name || "Resource Desk Staff";

    const [updated] = await db
      .update(orderItems)
      .set({
        fulfillmentStatus: "collected",
        collectedAt: new Date(),
        collectedByStaffName: staffName,
      })
      .where(eq(orderItems.id, targetItem.id))
      .returning();

    return NextResponse.json({
      ok: true,
      message: `Successfully marked "${updated.productName}" as collected for ${updated.customerName}!`,
      orderItem: updated,
    });
  } catch (error) {
    console.error("Failed to fulfill order item:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fulfill item" },
      { status: 500 }
    );
  }
}
