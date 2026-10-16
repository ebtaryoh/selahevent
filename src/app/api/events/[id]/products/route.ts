import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, eventProducts } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { getOrganization, getCurrentUser } from "@/lib/data";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get("activeOnly") === "true";

    const conditions = [eq(eventProducts.eventId, eventId)];
    if (activeOnly) {
      conditions.push(eq(eventProducts.isActive, true));
    }

    const products = await db
      .select()
      .from(eventProducts)
      .where(and(...conditions))
      .orderBy(asc(eventProducts.sortOrder), desc(eventProducts.createdAt));

    return NextResponse.json({ ok: true, products });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load products" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { ok: false, error: "Event not found or permission denied" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      price,
      currency,
      type,
      category,
      imageUrl,
      stockQuantity,
      downloadUrl,
      variants,
      requiresPickup,
      allowAddonAtCheckout,
      isActive,
      sortOrder,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "Product name is required" },
        { status: 400 }
      );
    }

    const priceNum = Math.max(0, parseInt(String(price || 0), 10));
    const stockNum = stockQuantity !== undefined && stockQuantity !== null && stockQuantity !== ""
      ? parseInt(String(stockQuantity), 10)
      : -1;

    const [created] = await db
      .insert(eventProducts)
      .values({
        eventId: event.id,
        name: name.trim(),
        description: (description || "").trim(),
        price: priceNum,
        currency: currency || event.currency || "NGN",
        type: type === "digital" ? "digital" : "physical",
        category: category || "Merchandise",
        imageUrl: imageUrl || null,
        stockQuantity: isNaN(stockNum) ? -1 : stockNum,
        downloadUrl: downloadUrl || null,
        variants: Array.isArray(variants) ? variants : [],
        requiresPickup: type === "digital" ? false : (requiresPickup !== false),
        allowAddonAtCheckout: allowAddonAtCheckout !== false,
        isActive: isActive !== false,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      })
      .returning();

    return NextResponse.json({ ok: true, product: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
