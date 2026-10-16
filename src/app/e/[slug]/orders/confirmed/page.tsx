import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { events, organizations, payments, orderItems, eventProducts } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { fulfillOrderByReference } from "@/lib/order-fulfillment";
import { formatMoney } from "@/lib/format";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  ShoppingBag,
  ArrowLeft,
  Download,
  Calendar,
  MapPin,
  Clock,
  Printer,
  ShieldCheck,
  Building2,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reference?: string; orderCode?: string; trxref?: string }>;
};

export default async function OrderConfirmedPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const query = await searchParams;

  const event = await db
    .select()
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1)
    .then((r) => r[0]);

  if (!event) notFound();

  const org = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, event.organizationId))
    .limit(1)
    .then((r) => r[0]);

  const reference = query.reference || query.trxref;
  const orderCode = query.orderCode;

  // Real-time fulfillment: if reference provided, ensure payment is verified and stock is decremented
  if (reference) {
    try {
      await fulfillOrderByReference(reference);
    } catch (err) {
      console.error("[selah] Error fulfilling order from confirmation page:", err);
    }
  }

  // Fetch linked order items
  const conditions = [eq(orderItems.eventId, event.id)];
  if (reference) {
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.gatewayReference, reference))
      .limit(1)
      .then((r) => r[0]);
    if (payment) {
      conditions.push(eq(orderItems.paymentId, payment.id));
    } else if (orderCode) {
      conditions.push(eq(orderItems.orderCode, orderCode));
    }
  } else if (orderCode) {
    conditions.push(eq(orderItems.orderCode, orderCode));
  }

  const items = await db
    .select({
      orderItem: orderItems,
      product: eventProducts,
    })
    .from(orderItems)
    .leftJoin(eventProducts, eq(orderItems.productId, eventProducts.id))
    .where(and(...conditions))
    .orderBy(orderItems.createdAt);

  const primaryItem = items[0]?.orderItem;
  const totalAmount = items.reduce((acc, curr) => acc + curr.orderItem.totalPrice, 0);

  return (
    <div
      className="min-h-screen bg-[var(--color-parchment)] pt-20 pb-24 px-4 sm:px-6"
      style={
        event.brandColor
          ? ({
              "--color-brass": event.brandColor,
              "--color-brass-deep": `color-mix(in srgb, ${event.brandColor}, black 20%)`,
              "--color-brass-light": `color-mix(in srgb, ${event.brandColor}, white 30%)`,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className="container mx-auto max-w-2xl">
        {/* Navigation link */}
        <div className="mb-6">
          <Link
            href={`/e/${event.slug}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-warm-500 hover:text-ink transition-colors"
          >
            <ArrowLeft size={14} /> Back to {event.title}
          </Link>
        </div>

        {/* Success Header Card */}
        <div className="card p-8 border border-brass/30 bg-paper shadow-lg rounded-2xl relative overflow-hidden">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 ring-8 ring-emerald-50">
              <CheckCircle2 size={36} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brass/10 text-brass-deep text-[0.7rem] font-bold uppercase tracking-wider mb-2">
              <Building2 size={12} /> {org?.name || "Official Ministry Order"}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              Pre-order Confirmed!
            </h1>

            <p className="text-warm-500 text-sm mt-2 max-w-md">
              Thank you, <strong className="text-ink">{primaryItem?.customerName || "Friend"}</strong>. Your order has been placed successfully for <strong>{event.title}</strong>.
            </p>

            {/* Ministry Beneficiary Notice */}
            <div className="mt-5 w-full rounded-xl bg-[rgba(192,138,46,0.08)] border border-brass/25 p-4 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-brass-deep uppercase tracking-wider">
                <ShieldCheck size={14} /> Official Ministry Receipt
              </div>
              <p className="text-xs text-warm-600 mt-1 leading-relaxed">
                Payment received directly for <strong>{org?.name}</strong>. A confirmation email with your digital pass and collection voucher has been dispatched to{" "}
                <strong className="text-ink">{primaryItem?.customerEmail}</strong>.
              </p>
            </div>
          </div>

          {/* Itemized Order Cards with Pickup Vouchers */}
          <div className="mt-8 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-warm-500 border-b border-black/10 pb-2">
              Your Pre-ordered Items &amp; Collection Vouchers
            </h2>

            {items.map(({ orderItem: item, product }) => {
              const isDigital = item.productType === "digital";

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-black/10 bg-warm-50/60 p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[0.68rem] uppercase font-bold text-brass tracking-wider">
                        {product?.category || "Official Material"}
                      </div>
                      <h3 className="font-display text-base font-bold text-ink mt-0.5">
                        {item.productName}
                      </h3>
                      {item.variant && (
                        <div className="mt-1 text-xs text-brass-deep font-semibold bg-warm-200/60 px-2 py-0.5 rounded inline-block">
                          Option: {item.variant}
                        </div>
                      )}
                      <div className="text-xs text-warm-500 mt-1">
                        Quantity: <strong>{item.quantity}</strong> × {formatMoney(item.unitPrice, event.currency)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-ink text-sm">
                        {formatMoney(item.totalPrice, event.currency)}
                      </div>
                      <span className="pill text-[0.65rem] font-semibold bg-emerald-100 text-emerald-800 border-emerald-300 mt-1">
                        Paid
                      </span>
                    </div>
                  </div>

                  {/* Pickup voucher or digital link */}
                  {isDigital ? (
                    <div className="pt-3 border-t border-black/10 text-center">
                      {product?.downloadUrl ? (
                        <a
                          href={product.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-brass !w-full !py-2.5 !text-xs font-semibold inline-flex items-center justify-center gap-2"
                        >
                          <Download size={15} /> Download Digital Resource
                        </a>
                      ) : (
                        <p className="text-xs text-warm-500 italic">
                          Digital access will be unlocked during the live session.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-brass/40 bg-white p-4 flex flex-col sm:flex-row items-center gap-4">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm shrink-0 border border-black/5">
                        <QRCodeSVG value={item.pickupVoucherCode} size={64} level="M" />
                      </div>
                      <div className="min-w-0 flex-1 text-center sm:text-left">
                        <div className="text-[0.65rem] font-bold uppercase tracking-wider text-brass-deep">
                          Resource Desk Collection Code
                        </div>
                        <div className="font-mono text-base font-extrabold text-neutral-900 tracking-wider">
                          {item.pickupVoucherCode}
                        </div>
                        <p className="text-[0.72rem] text-neutral-600 mt-0.5 leading-snug">
                          Show this code or QR pass at the <strong>{org?.name} Resource Desk</strong> to claim your item on-site.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Event Details Summary */}
          <div className="mt-8 pt-6 border-t border-black/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-warm-500 mb-3">
              Event Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-warm-600">
              <div className="flex items-center gap-2 bg-warm-50 p-3 rounded-lg border border-black/5">
                <Calendar size={15} className="text-brass shrink-0" />
                <span>
                  {new Date(event.startsAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-warm-50 p-3 rounded-lg border border-black/5">
                <MapPin size={15} className="text-brass shrink-0" />
                <span className="truncate">{event.venueName || event.city || "Event Venue"}</span>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="mt-8 pt-6 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-warm-500">
              Order Code: <span className="font-mono font-bold text-ink">{primaryItem?.orderCode || orderCode}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href={`/e/${event.slug}`}
                className="btn btn-secondary !text-xs !py-2.5 flex-1 sm:flex-initial text-center"
              >
                Return to Event
              </Link>
              <Link
                href={`/e/${event.slug}/wallet`}
                className="btn btn-brass !text-xs !py-2.5 flex-1 sm:flex-initial text-center"
              >
                Open My Wallet
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
