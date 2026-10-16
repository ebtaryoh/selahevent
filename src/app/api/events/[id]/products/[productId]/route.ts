import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, eventProducts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrganization, getCurrentUser } from "@/lib/data";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const { id: eventId, productId } = await params;
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
      return NextResponse.json(
        { ok: false, error: "Event not found or permission denied" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const updateData: Partial<typeof eventProducts.$inferInsert> = {};

    if (body.name !== undefined) updateData.name = String(body.name).trim();
    if (body.description !== undefined) updateData.description = String(body.description).trim();
    if (body.price !== undefined) updateData.price = Math.max(0, parseInt(String(body.price), 10));
    if (body.currency !== undefined) updateData.currency = String(body.currency);
    if (body.type !== undefined) updateData.type = body.type === "digital" ? "digital" : "physical";
    if (body.category !== undefined) updateData.category = String(body.category);
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl || null;
    if (body.stockQuantity !== undefined) {
      const stock = parseInt(String(body.stockQuantity), 10);
      updateData.stockQuantity = isNaN(stock) ? -1 : stock;
    }
    if (body.downloadUrl !== undefined) updateData.downloadUrl = body.downloadUrl || null;
    if (body.variants !== undefined) updateData.variants = Array.isArray(body.variants) ? body.variants : [];
    if (body.requiresPickup !== undefined) updateData.requiresPickup = Boolean(body.requiresPickup);
    if (body.allowAddonAtCheckout !== undefined) updateData.allowAddonAtCheckout = Boolean(body.allowAddonAtCheckout);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.sortOrder !== undefined) updateData.sortOrder = Number(body.sortOrder) || 0;

    const [updated] = await db
      .update(eventProducts)
      .set(updateData)
      .where(and(eq(eventProducts.id, productId), eq(eventProducts.eventId, event.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, product: updated });
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const { id: eventId, productId } = await params;
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
      return NextResponse.json(
        { ok: false, error: "Event not found or permission denied" },
        { status: 404 }
      );
    }

    await db
      .delete(eventProducts)
      .where(and(eq(eventProducts.id, productId), eq(eventProducts.eventId, event.id)));

    return NextResponse.json({ ok: true, message: "Product deleted" });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
