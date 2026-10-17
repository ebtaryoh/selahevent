import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, organizations, eventProducts, orderItems, payments } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getOrganization, getCurrentUser } from "@/lib/data";
import { getRequestOrigin } from "@/lib/format";

function randomToken(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let str = "";
  for (let i = 0; i < len; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
}

export async function GET(
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

    const orders = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.eventId, event.id))
      .orderBy(desc(orderItems.createdAt));

    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    console.error("Failed to fetch event orders:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load orders" },
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
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)
      .then((r) => r[0]);

    if (!event) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    const body = await req.json();
    const { customerName, customerEmail, customerPhone, items } = body;

    if (!customerName || !customerEmail) {
      return NextResponse.json(
        { ok: false, error: "Name and email are required to complete your order." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Please select at least one item to purchase." },
        { status: 400 }
      );
    }

    // Fetch products
    const productIds = items.map((i) => i.productId).filter(Boolean);
    const fetchedProducts = await db
      .select()
      .from(eventProducts)
      .where(and(eq(eventProducts.eventId, event.id), inArray(eventProducts.id, productIds)));

    const productMap = new Map(fetchedProducts.map((p) => [p.id, p]));

    let totalAmount = 0;
    const validatedItems: Array<{
      product: typeof eventProducts.$inferSelect;
      quantity: number;
      variant?: string;
      lineTotal: number;
    }> = [];

    for (const item of items) {
      const prod = productMap.get(item.productId);
      if (!prod || !prod.isActive) continue;

      const qty = Math.max(1, parseInt(String(item.quantity || 1), 10));
      
      // Stock check
      if (prod.stockQuantity >= 0 && prod.stockQuantity < qty) {
        return NextResponse.json(
          { ok: false, error: `Sorry, "${prod.name}" has only ${prod.stockQuantity} item(s) left in stock.` },
          { status: 400 }
        );
      }

      const lineTotal = prod.price * qty;
      totalAmount += lineTotal;

      validatedItems.push({
        product: prod,
        quantity: qty,
        variant: item.variant || (prod.variants && (prod.variants as string[])[0]) || undefined,
        lineTotal,
      });
    }

    if (validatedItems.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No valid items selected for purchase." },
        { status: 400 }
      );
    }

    const orderCode = "ORD-" + randomToken(7);
    const requiresPayment = totalAmount > 0;
    const paymentRef = (requiresPayment ? "PAYSTACK_STORE_" : "FREE_STORE_") + randomToken(12);

    let paymentRecord: typeof payments.$inferSelect | null = null;
    let createdOrderItems: (typeof orderItems.$inferSelect)[] = [];

    await db.transaction(async (tx) => {
      // Create payment row if required
      if (requiresPayment) {
        const [p] = await tx
          .insert(payments)
          .values({
            eventId: event.id,
            amount: totalAmount,
            currency: event.currency || "NGN",
            gateway: "paystack",
            gatewayReference: paymentRef,
            status: "pending",
            verified: false,
          })
          .returning();
        paymentRecord = p;
      }

      for (const vi of validatedItems) {
        const voucherCode = "VCH-" + randomToken(6);
        const [oi] = await tx
          .insert(orderItems)
          .values({
            eventId: event.id,
            productId: vi.product.id,
            paymentId: paymentRecord?.id ?? null,
            orderCode,
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim().toLowerCase(),
            customerPhone: (customerPhone || "").trim(),
            productName: vi.product.name,
            productType: vi.product.type,
            variant: vi.variant || null,
            unitPrice: vi.product.price,
            quantity: vi.quantity,
            totalPrice: vi.lineTotal,
            status: requiresPayment ? "pending" : "paid",
            fulfillmentStatus: vi.product.type === "digital" ? "ready_for_pickup" : "unfulfilled",
            pickupVoucherCode: voucherCode,
          })
          .returning();

        createdOrderItems.push(oi);

        // If free, immediately increment sold count & decrement stock
        if (!requiresPayment) {
          if (vi.product.stockQuantity >= 0) {
            await tx
              .update(eventProducts)
              .set({
                stockQuantity: Math.max(0, vi.product.stockQuantity - vi.quantity),
                soldCount: vi.product.soldCount + vi.quantity,
              })
              .where(eq(eventProducts.id, vi.product.id));
          } else {
            await tx
              .update(eventProducts)
              .set({ soldCount: vi.product.soldCount + vi.quantity })
              .where(eq(eventProducts.id, vi.product.id));
          }
        }
      }
    });

    // If requires payment, initialize Paystack transaction
    if (requiresPayment && paymentRecord) {
      const org = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, event.organizationId))
        .limit(1)
        .then((r) => r[0]);

      const secretKey = org?.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY;

      if (!secretKey) {
        return NextResponse.json(
          { ok: false, error: "Payment gateway is not configured for this organization." },
          { status: 500 }
        );
      }

      const callbackUrl =
        `${getRequestOrigin(req)}/e/${event.slug}/orders/confirmed?reference=${encodeURIComponent(paymentRef)}&orderCode=${encodeURIComponent(orderCode)}`;

      const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        signal: AbortSignal.timeout(15000),
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: customerEmail.trim().toLowerCase(),
          amount: Math.round(totalAmount * 100),
          reference: paymentRef,
          metadata: {
            eventId: event.id,
            orderCode,
            type: "standalone_store_order",
            orderItemIds: createdOrderItems.map((i) => i.id),
            custom_fields: [
              {
                display_name: "Organizer / Ministry",
                variable_name: "organizer_name",
                value: org?.name || "Event Organizer",
              },
              {
                display_name: "Event",
                variable_name: "event_title",
                value: event.title,
              },
              {
                display_name: "Order Code",
                variable_name: "order_code",
                value: orderCode,
              },
            ],
          },
          callback_url: callbackUrl,
        }),
      });

      const paystackData = await paystackRes.json().catch(() => null);

      if (!paystackRes.ok || !paystackData?.status || !paystackData?.data?.authorization_url) {
        console.error("Paystack standalone order initialization failed:", paystackData);
        return NextResponse.json(
          { ok: false, error: "Could not initialize payment with Paystack. Please try again." },
          { status: 502 }
        );
      }

      const checkoutUrl = paystackData.data.authorization_url;
      await db
        .update(payments)
        .set({ checkoutUrl })
        .where(eq(payments.id, (paymentRecord as any).id));

      return NextResponse.json({
        ok: true,
        orderCode,
        requiresPayment: true,
        checkoutUrl,
        orderItems: createdOrderItems,
      });
    }

    return NextResponse.json({
      ok: true,
      orderCode,
      requiresPayment: false,
      orderItems: createdOrderItems,
    });
  } catch (error) {
    console.error("Failed to process store order:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong processing your order." },
      { status: 500 }
    );
  }
}
