import { db } from "@/db";
import {
  payments,
  orderItems,
  eventProducts,
  events,
  organizations,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { sendOrderConfirmationEmail } from "@/lib/email";

export interface FulfillmentResult {
  ok: boolean;
  error?: string;
  paymentId?: string;
  orderCode?: string;
  fulfilledItemsCount?: number;
  orderItems?: any[];
}

/**
 * Fulfills an order by its Paystack transaction reference.
 * If the payment is not marked as paid in the DB, it checks with Paystack API first.
 */
export async function fulfillOrderByReference(reference: string): Promise<FulfillmentResult> {
  if (!reference) return { ok: false, error: "Missing reference" };

  const payment = await db
    .select()
    .from(payments)
    .where(eq(payments.gatewayReference, reference))
    .limit(1)
    .then((r) => r[0]);

  if (!payment) {
    return { ok: false, error: "Payment record not found for this reference" };
  }

  // If not yet verified or paid, verify with Paystack directly
  if (payment.status !== "paid" || !payment.verified) {
    let secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (payment.eventId) {
      const event = await db
        .select()
        .from(events)
        .where(eq(events.id, payment.eventId))
        .limit(1)
        .then((r) => r[0]);

      if (event?.organizationId) {
        const org = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, event.organizationId))
          .limit(1)
          .then((r) => r[0]);

        if (org?.paystackSecretKey) {
          secretKey = org.paystackSecretKey;
        }
      }
    }

    if (secretKey) {
      try {
        const verifyRes = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
          {
            signal: AbortSignal.timeout(10000),
            headers: { Authorization: `Bearer ${secretKey}` },
          }
        );
        const verifyData = await verifyRes.json().catch(() => null);

        if (verifyData?.status && verifyData?.data?.status === "success") {
          await db
            .update(payments)
            .set({
              status: "paid",
              verified: true,
              paidAt: verifyData.data.paid_at ? new Date(verifyData.data.paid_at) : new Date(),
            })
            .where(eq(payments.id, payment.id));
        } else {
          return {
            ok: false,
            error: verifyData?.data?.gateway_response || "Payment verification pending",
          };
        }
      } catch (err) {
        console.warn("Paystack direct verification call failed:", err);
      }
    }
  }

  return fulfillOrderPayment(payment.id);
}

/**
 * Idempotently marks a payment and all its linked order items as 'paid',
 * decrements product stock, increments sold_count, and dispatches the branded confirmation email.
 */
export async function fulfillOrderPayment(paymentId: string): Promise<FulfillmentResult> {
  const payment = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1)
    .then((r) => r[0]);

  if (!payment) return { ok: false, error: "Payment not found" };

  const event = payment.eventId
    ? await db
        .select()
        .from(events)
        .where(eq(events.id, payment.eventId))
        .limit(1)
        .then((r) => r[0])
    : null;

  const org = event?.organizationId
    ? await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, event.organizationId))
        .limit(1)
        .then((r) => r[0])
    : null;

  let newlyFulfilledCount = 0;
  let allLinkedItems: any[] = [];

  await db.transaction(async (tx) => {
    // Ensure payment is marked paid
    if (payment.status !== "paid" || !payment.verified) {
      await tx
        .update(payments)
        .set({
          status: "paid",
          verified: true,
          paidAt: payment.paidAt || new Date(),
        })
        .where(eq(payments.id, payment.id));
    }

    allLinkedItems = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.paymentId, payment.id));

    for (const item of allLinkedItems) {
      if (item.status !== "paid") {
        await tx
          .update(orderItems)
          .set({ status: "paid" })
          .where(eq(orderItems.id, item.id));

        if (item.productId) {
          await tx.execute(sql`
            UPDATE event_products
            SET sold_count = sold_count + ${item.quantity},
                stock_quantity = CASE WHEN stock_quantity >= 0 THEN GREATEST(0, stock_quantity - ${item.quantity}) ELSE stock_quantity END
            WHERE id = ${item.productId}
          `);
        }

        newlyFulfilledCount++;
      }
    }
  });

  // If newly fulfilled items exist, dispatch the official organizer order confirmation email!
  if (newlyFulfilledCount > 0 && allLinkedItems.length > 0 && event && org) {
    const primaryItem = allLinkedItems[0];
    const customerEmail = primaryItem.customerEmail;
    const customerName = primaryItem.customerName;
    const orderCode = primaryItem.orderCode;

    // Fetch product details for digital download URLs
    const itemsWithProducts = await db
      .select({
        item: orderItems,
        product: eventProducts,
      })
      .from(orderItems)
      .leftJoin(eventProducts, eq(orderItems.productId, eventProducts.id))
      .where(eq(orderItems.paymentId, payment.id));

    try {
      await sendOrderConfirmationEmail(customerEmail, {
        customerName,
        organizationName: org.name,
        eventName: event.title,
        orderCode,
        currency: event.currency,
        totalAmount: payment.amount,
        items: itemsWithProducts.map(({ item, product }) => ({
          productName: item.productName,
          variant: item.variant,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          pickupVoucherCode: item.pickupVoucherCode,
          isDigital: item.productType === "digital",
          downloadUrl: product?.downloadUrl || null,
        })),
        eventDate: event.startsAt
          ? new Date(event.startsAt).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : undefined,
        eventVenue: event.venueName || event.city || "Event Venue",
      });
      console.log(`[selah] Dispatched order confirmation email to ${customerEmail} for order ${orderCode}`);
    } catch (err) {
      console.error("[selah] Error sending order confirmation email:", err);
    }
  }

  return {
    ok: true,
    paymentId: payment.id,
    orderCode: allLinkedItems[0]?.orderCode,
    fulfilledItemsCount: newlyFulfilledCount,
    orderItems: allLinkedItems,
  };
}
