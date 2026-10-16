import { notFound, redirect } from "next/navigation";
import { getEventBySlug } from "@/lib/data";
import { getAttendeeSession, getAttendeeProfile } from "@/lib/attendee";
import { AttendeeLogin } from "@/components/attendee-login";
import { db } from "@/db";
import { registrations, events as eventsTable, orderItems, eventProducts } from "@/db/schema";
import { eq, and, desc, or, ilike, inArray } from "drizzle-orm";
import { Ticket, Calendar, MapPin, Download, ShoppingBag, Package, QrCode, CheckCircle2, Clock } from "lucide-react";
import { formatTime, formatRange, formatMoney } from "@/lib/format";
import { QRCodeSVG } from "qrcode.react";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ reference?: string; trxref?: string; email?: string }>;
};

export default async function WalletPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const reference = query.reference || query.trxref;

  // If returning from Paystack for a store preorder, redirect to dedicated confirmation voucher page
  if (reference && reference.startsWith("PAYSTACK_STORE_")) {
    redirect(`/e/${slug}/orders/confirmed?reference=${encodeURIComponent(reference)}`);
  }

  const event = await getEventBySlug(slug);
  
  if (!event) {
    notFound();
  }

  const session = await getAttendeeSession();
  
  // They are either not logged in, or logged into a different org
  if (!session || session.orgId !== event.organizationId || !session.attendeeId) {
    return (
      <div 
        className="min-h-screen bg-[var(--color-parchment)] pt-32 pb-20 px-6"
        style={event.brandColor ? {
          '--color-brass': event.brandColor,
          '--color-brass-deep': `color-mix(in srgb, ${event.brandColor}, black 20%)`,
        } as React.CSSProperties : undefined}
      >
        <AttendeeLogin orgId={event.organizationId} />
      </div>
    );
  }

  const profile = await getAttendeeProfile();

  // Fetch their registrations for this org
  const myRegistrations = await db
    .select({
      registration: registrations,
      event: eventsTable,
    })
    .from(registrations)
    .innerJoin(eventsTable, eq(registrations.eventId, eventsTable.id))
    .where(
      and(
        eq(registrations.attendeeId, session.attendeeId),
        eq(eventsTable.organizationId, event.organizationId)
      )
    )
    .orderBy(desc(registrations.createdAt));

  const regIds = myRegistrations.map((r) => r.registration.id);
  const myOrderItems = await db
    .select({
      orderItem: orderItems,
      product: eventProducts,
    })
    .from(orderItems)
    .leftJoin(eventProducts, eq(orderItems.productId, eventProducts.id))
    .where(
      and(
        eq(orderItems.eventId, event.id),
        regIds.length > 0
          ? or(
              ilike(orderItems.customerEmail, session.email.trim()),
              inArray(orderItems.registrationId, regIds)
            )
          : ilike(orderItems.customerEmail, session.email.trim())
      )
    )
    .orderBy(desc(orderItems.createdAt));

  return (
    <div 
      className="min-h-screen bg-[var(--color-parchment)] pt-24 pb-20 px-6"
      style={event.brandColor ? {
        '--color-brass': event.brandColor,
        '--color-brass-deep': `color-mix(in srgb, ${event.brandColor}, black 20%)`,
        '--color-brass-light': `color-mix(in srgb, ${event.brandColor}, white 30%)`,
        '--color-brass-wash': `color-mix(in srgb, ${event.brandColor}, white 85%)`,
      } as React.CSSProperties : undefined}
    >
      <div className="container mx-auto max-w-4xl">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">
              My Tickets
            </h1>
            <p className="text-warm-500 mt-1">
              Welcome back, {profile?.firstName || session.email}
            </p>
          </div>
          <a href={`/e/${event.slug}`} className="btn btn-ghost text-sm">
            Go to Event Page
          </a>
        </div>

        {myRegistrations.length === 0 ? (
          <div className="card p-12 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-warm-200 rounded-full flex items-center justify-center mb-4">
              <Ticket className="text-warm-400 h-8 w-8" />
            </div>
            <h3 className="font-display text-lg font-semibold text-ink">No tickets found</h3>
            <p className="text-warm-500 mt-2 max-w-md mx-auto">
              You haven&apos;t registered for any events from this organization yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {myRegistrations.map(({ registration, event: e }) => (
              <div key={registration.id} className="card p-0 overflow-hidden flex flex-col sm:flex-row">
                <div className="bg-[var(--color-brass)] w-full sm:w-5 flex-shrink-0 h-3 sm:h-auto" />
                <div className="p-6 sm:p-8 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgba(22,19,17,0.06)] text-warm-600">
                          {registration.status.toUpperCase()}
                        </span>
                        {registration.ticketTypeId && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cypress/10 text-cypress">
                            {registration.attendeeType.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-xl font-semibold text-ink">
                        {e.title}
                      </h3>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-warm-600">
                          <Calendar size={15} className="text-warm-400" />
                          <span>{formatRange(e.startsAt, e.endsAt)}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-warm-600">
                          <MapPin size={15} className="text-warm-400 mt-0.5 shrink-0" />
                          <span>
                            {e.venueName ?? ""}{e.venueAddress ? `, ${e.venueAddress}` : ""} · {e.city}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-start sm:items-end gap-2 border-t sm:border-t-0 sm:border-l border-[rgba(22,19,17,0.1)] pt-4 sm:pt-0 sm:pl-6 mt-4 sm:mt-0 min-w-[200px]">
                      <div className="text-[0.7rem] uppercase tracking-wider text-warm-400 font-semibold">
                        Ticket Code
                      </div>
                      <div className="font-mono text-lg font-medium text-ink bg-warm-100 px-3 py-1 rounded">
                        {registration.ticketCode}
                      </div>
                      <p className="text-xs text-warm-500 mt-1 max-w-[200px] text-left sm:text-right">
                        Present this code or your email at the event check-in desk.
                      </p>
                      
                      <a 
                        href={`/api/tickets/${registration.ticketCode}/pdf`}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brass-deep)] hover:text-ink transition-colors bg-[rgba(226,192,115,0.1)] px-3 py-1.5 rounded-full"
                        target="_blank"
                        rel="noreferrer"
                        download
                      >
                        <Download size={13} />
                        Download PDF Ticket
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Purchased Resources & Merchandise */}
        {myOrderItems.length > 0 && (
          <div className="mt-14">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink flex items-center gap-2.5">
                  <ShoppingBag size={22} className="text-brass" /> My Resources &amp; Merchandise
                </h2>
                <p className="text-xs text-warm-500 mt-1">
                  Items you have pre-ordered for {event.title}. Collect physical items at the Resource Desk with your voucher code.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {myOrderItems.map(({ orderItem, product }) => {
                const isCollected = orderItem.fulfillmentStatus === "collected";
                const isDigital = orderItem.productType === "digital";

                return (
                  <div
                    key={orderItem.id}
                    className="card p-6 border border-white/10 bg-paper flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[0.68rem] uppercase tracking-wider text-brass font-bold">
                            {product?.category || "Merchandise"}
                          </div>
                          <h3 className="font-display text-lg font-semibold text-ink mt-0.5">
                            {orderItem.productName}
                          </h3>
                          {orderItem.variant && (
                            <span className="inline-block mt-1 text-xs text-warm-500 font-medium bg-warm-100 px-2 py-0.5 rounded">
                              Option: {orderItem.variant}
                            </span>
                          )}
                        </div>

                        <span
                          className={`pill text-[0.68rem] shrink-0 font-semibold ${
                            isCollected
                              ? "bg-emerald-950/20 text-emerald-700 border-emerald-500/30"
                              : isDigital
                              ? "bg-sky-950/20 text-sky-700 border-sky-500/30"
                              : "bg-amber-950/20 text-amber-700 border-amber-500/30"
                          }`}
                        >
                          {isCollected
                            ? "✓ Picked Up"
                            : isDigital
                            ? "Digital Access"
                            : "Ready for Pickup"}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-warm-500 pt-3 border-t border-white/10">
                        <span>Quantity: <strong>{orderItem.quantity}</strong></span>
                        <span className="font-bold text-ink text-sm">
                          {formatMoney(orderItem.totalPrice, event.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Voucher / Download Box */}
                    <div className="mt-5 pt-4 border-t border-white/10">
                      {isDigital ? (
                        product?.downloadUrl ? (
                          <a
                            href={product.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-brass !w-full !py-2.5 !text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                          >
                            <Download size={14} /> Download Digital File
                          </a>
                        ) : (
                          <div className="text-xs text-warm-500 text-center py-2">
                            Digital download link will be active during the event.
                          </div>
                        )
                      ) : (
                        <div className="rounded-xl border border-brass/25 bg-[rgba(226,192,115,0.06)] p-3.5 flex items-center gap-3.5">
                          <div className="bg-white p-1 rounded-md shrink-0 shadow-sm">
                            <QRCodeSVG
                              value={orderItem.pickupVoucherCode}
                              size={52}
                              level="M"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[0.65rem] uppercase tracking-wider text-warm-500 font-semibold">
                              Pickup Voucher Code
                            </div>
                            <div className="font-mono text-sm font-bold text-ink">
                              {orderItem.pickupVoucherCode}
                            </div>
                            <p className="text-[0.68rem] text-warm-500 mt-0.5 leading-tight">
                              {isCollected
                                ? `Collected by staff: ${orderItem.collectedByStaffName || "Resource Desk"}`
                                : "Show this code at the Resource Desk to claim."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
