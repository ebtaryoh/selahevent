import { and, eq, sql, inArray } from "drizzle-orm";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, organizations, payments, registrations, ticketTypes, attendees, ticketReservations, ministryFollowers, eventProducts, orderItems } from "@/db/schema";
import { sendTicketConfirmation } from "@/lib/email";
import { enforceRateLimit, getClientAddress, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESERVATION_MINUTES = 15;
const IDEMPOTENCY_MAX_LENGTH = 128;

function randomToken(bytes = 8) {
  return randomBytes(bytes).toString("hex").toUpperCase();
}

function makeCode(prefix: string) {
  return prefix + "-" + randomToken(5);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 128 * 1024) {
    return NextResponse.json({ ok: false, error: "Registration submission is too large." }, { status: 413 });
  }

  const clientAddress = getClientAddress(request);
  const abuseLimit = await enforceRateLimit("registration-ip", clientAddress, 30, 60);
  if (!abuseLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many registration attempts. Please wait a moment and try again." },
      { status: 429, headers: rateLimitHeaders(abuseLimit) },
    );
  }
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "We couldn't read that submission. Please try again." }, { status: 400 });
  }

  const idempotencyKey = String(payload.idempotencyKey ?? "").trim();
  if (idempotencyKey && idempotencyKey.length > IDEMPOTENCY_MAX_LENGTH) {
    return NextResponse.json({ ok: false, error: "Invalid idempotency key." }, { status: 422 });
  }

  const slug = String(payload.eventSlug ?? "").trim();
  const firstName = String(payload.firstName ?? "").trim();
  const lastName = String(payload.lastName ?? "").trim();
  const email = String(payload.email ?? "").trim().toLowerCase();

  const missing: string[] = [];
  if (!slug) missing.push("event");
  if (!firstName) missing.push("first name");
  if (!lastName) missing.push("last name");
  if (!email) missing.push("email address");
  if (missing.length) {
    return NextResponse.json({ ok: false, error: "Please complete the following: " + missing.join(", ") + "." }, { status: 422 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "That email address doesn't look right. Please check and try again." }, { status: 422 });
  }

  const lengthLimits: Array<[string, string, number]> = [
    ["first name", firstName, 100],
    ["last name", lastName, 100],
    ["email address", email, 254],
    ["phone number", String(payload.phone ?? "").trim(), 40],
    ["city", String(payload.city ?? "").trim(), 120],
    ["country", String(payload.country ?? "").trim(), 120],
    ["church", String(payload.church ?? "").trim(), 200],
    ["attendee type", String(payload.attendeeType ?? "").trim(), 80],
    ["dietary information", String(payload.dietary ?? "").trim(), 500],
    ["emergency name", String(payload.emergencyName ?? "").trim(), 120],
    ["emergency phone", String(payload.emergencyPhone ?? "").trim(), 40],
  ];
  const oversized = lengthLimits.find(([, value, max]) => value.length > max);
  if (oversized) {
    return NextResponse.json({ ok: false, error: oversized[0] + " is too long." }, { status: 422 });
  }

  const event = await db.select().from(events).where(eq(events.slug, slug)).limit(1).then(r => r[0]);
  if (!event) return NextResponse.json({ ok: false, error: "That event could not be found." }, { status: 404 });

  const { getOrgSession } = await import("@/lib/session");
  const orgSession = await getOrgSession();
  const isStaff = Boolean(orgSession && orgSession.orgId === event.organizationId);

  if (event.status === "cancelled") {
    return NextResponse.json(
      { ok: false, error: "Registration is not available because this event has been cancelled by the organizers." },
      { status: 409 }
    );
  }

  if (event.status === "postponed") {
    return NextResponse.json(
      { ok: false, error: "Registration is temporarily paused because this event has been postponed." },
      { status: 409 }
    );
  }

  const now = new Date();
  if (!isStaff && event.registrationOpensAt && now < event.registrationOpensAt) {
    return NextResponse.json({ ok: false, error: "Registration for this event has not opened yet." }, { status: 409 });
  }
  if (!isStaff && event.registrationClosesAt && now > event.registrationClosesAt) {
    return NextResponse.json({ ok: false, error: "Registration for this event is closed." }, { status: 409 });
  }

  const ticketId = typeof payload.ticketTypeId === "string" && payload.ticketTypeId ? payload.ticketTypeId : null;
  const ticket = ticketId
    ? await db.select().from(ticketTypes).where(and(eq(ticketTypes.id, ticketId), eq(ticketTypes.eventId, event.id))).limit(1).then(r => r[0])
    : undefined;

  if (ticketId && !ticket) {
    return NextResponse.json({ ok: false, error: "That ticket type is not available for this event." }, { status: 422 });
  }
  if (ticket && !ticket.isVisible) {
    return NextResponse.json({ ok: false, error: "That ticket type is no longer available." }, { status: 409 });
  }

  if (idempotencyKey) {
    const existingByKey = await db
      .select({ id: registrations.id, code: registrations.code, ticketCode: registrations.ticketCode, status: registrations.status, amount: registrations.amount })
      .from(registrations)
      .where(and(eq(registrations.eventId, event.id), eq(registrations.idempotencyKey, idempotencyKey)))
      .limit(1)
      .then(r => r[0]);

    if (existingByKey) {
      const existingPayment = await db
        .select({
          status: payments.status,
          reference: payments.gatewayReference,
          checkoutUrl: payments.checkoutUrl,
        })
        .from(payments)
        .where(eq(payments.registrationId, existingByKey.id))
        .limit(1)
        .then(r => r[0]);

      return NextResponse.json({
        ok: true,
        reused: true,
        registration: existingByKey,
        payment: existingPayment
          ? {
              required: existingByKey.amount > 0,
              status: existingPayment.status,
              reference: existingPayment.reference,
              checkoutUrl: existingPayment.checkoutUrl,
            }
          : null,
      });
    }
  }

  const emailEventRate = await enforceRateLimit("registration-email-event", event.id + ":" + email, 5, 600);
  if (!emailEventRate.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many registration attempts for this email address. Please try again later." },
      { status: 429, headers: rateLimitHeaders(emailEventRate) },
    );
  }

  const eventRate = await enforceRateLimit("registration-event", event.id, 120, 60);
  if (!eventRate.allowed) {
    return NextResponse.json(
      { ok: false, error: "This event is receiving a high volume of registrations. Please try again shortly." },
      { status: 429, headers: rateLimitHeaders(eventRate) },
    );
  }

  const duplicate = await db
    .select({ id: registrations.id, status: registrations.status })
    .from(registrations)
    .where(and(eq(registrations.eventId, event.id), eq(registrations.email, email)))
    .limit(1)
    .then(r => r[0]);

  if (duplicate && !["cancelled", "failed"].includes(duplicate.status)) {
    return NextResponse.json(
      { ok: false, error: "This email already has a registration for this event." },
      { status: 409 },
    );
  }

  const staffPaymentMethod = typeof payload.staffPaymentMethod === "string" ? payload.staffPaymentMethod : null;
  const isDoorPayment = Boolean(
    isStaff && staffPaymentMethod && ["cash", "pos", "complimentary"].includes(staffPaymentMethod)
  );

  // Parse any additional guests (Group & Family Registration)
  const rawGuests = Array.isArray(payload.guests) ? payload.guests.slice(0, 10) : [];
  const validGuests: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    ticketTypeId: string | null;
    gender: string | null;
    relationship: string | null;
  }> = [];

  for (let i = 0; i < rawGuests.length; i++) {
    const g = rawGuests[i];
    if (g && typeof g.firstName === "string" && g.firstName.trim().length > 0) {
      const gFirstName = g.firstName.trim().slice(0, 100);
      const gLastName = (typeof g.lastName === "string" && g.lastName.trim()) ? g.lastName.trim().slice(0, 100) : lastName;
      let gEmail = (typeof g.email === "string" && g.email.trim()) ? g.email.trim().toLowerCase() : "";
      if (!gEmail || !EMAIL_RE.test(gEmail)) {
        const emailParts = email.split("@");
        gEmail = `${emailParts[0]}+guest${i + 1}@${emailParts[1] || "attendee.selah"}`;
      }
      const gPhone = (typeof g.phone === "string" && g.phone.trim()) ? g.phone.trim().slice(0, 40) : (String(payload.phone ?? "").trim());
      const gTicketId = typeof g.ticketTypeId === "string" && g.ticketTypeId ? g.ticketTypeId : (ticket?.id ?? null);
      const gGender = typeof g.gender === "string" && g.gender.trim() ? g.gender.trim() : null;
      const gRel = typeof g.relationship === "string" && g.relationship.trim() ? g.relationship.trim() : null;
      validGuests.push({
        firstName: gFirstName,
        lastName: gLastName,
        email: gEmail,
        phone: gPhone,
        ticketTypeId: gTicketId,
        gender: gGender,
        relationship: gRel,
      });
    }
  }

  // Pre-fetch all ticket types needed
  const allNeededTicketIds = Array.from(new Set([
    ...(ticket ? [ticket.id] : []),
    ...validGuests.map(g => g.ticketTypeId).filter(Boolean) as string[],
  ]));

  const fetchedTickets = allNeededTicketIds.length > 0
    ? await db.select().from(ticketTypes).where(inArray(ticketTypes.id, allNeededTicketIds))
    : [];
  const ticketMap = new Map(fetchedTickets.map(t => [t.id, t]));

  // Calculate base amounts
  const primaryBase = (ticket?.isDonation && typeof payload.donationAmount === "number" && payload.donationAmount >= (ticket?.price ?? 0))
    ? payload.donationAmount
    : (ticket?.price ?? 0);

  let totalBaseAmount = primaryBase;
  for (const g of validGuests) {
    const gTicket = g.ticketTypeId ? ticketMap.get(g.ticketTypeId) : ticket;
    totalBaseAmount += (gTicket?.price ?? 0);
  }

  // Calculate add-on products (merchandise, books, media pass)
  const addonItems = Array.isArray(payload.addons) ? payload.addons : [];
  const addonProductIds = addonItems
    .map((a: { productId?: string }) => a?.productId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  const fetchedAddonProducts = addonProductIds.length > 0
    ? await db.select().from(eventProducts).where(and(eq(eventProducts.eventId, event.id), inArray(eventProducts.id, addonProductIds)))
    : [];
  const addonProductMap = new Map(fetchedAddonProducts.map(p => [p.id, p]));

  let addonsTotal = 0;
  const validatedAddons: Array<{ product: typeof eventProducts.$inferSelect; variant?: string; quantity: number; lineTotal: number }> = [];

  for (const item of addonItems) {
    const prod = addonProductMap.get(item.productId);
    if (!prod || !prod.isActive) continue;
    const qty = Math.max(1, parseInt(String(item.quantity || 1), 10));
    const lineTotal = prod.price * qty;
    addonsTotal += lineTotal;
    validatedAddons.push({
      product: prod,
      variant: item.variant || (Array.isArray(prod.variants) && (prod.variants as string[])[0]) || undefined,
      quantity: qty,
      lineTotal,
    });
  }

  totalBaseAmount += addonsTotal;

  // Pass-Through Convenience Fee calculation ("The Church Pays ₦0" Model)
  const passFee = Boolean(ticket?.passFeeToAttendee ?? true);
  const convenienceFee = (passFee && totalBaseAmount > 0 && !isDoorPayment)
    ? Math.min(2000, Math.round(totalBaseAmount < 2500 ? totalBaseAmount * 0.015 : (totalBaseAmount * 0.015 + 100)))
    : 0;

  const totalAmountToCharge = (isDoorPayment && staffPaymentMethod === "complimentary") ? 0 : (totalBaseAmount + convenienceFee);
  const amount = totalAmountToCharge;
  const requiresPayment = amount > 0;
  const reference = (isDoorPayment ? `DOOR_${staffPaymentMethod!.toUpperCase()}_` : (requiresPayment ? "PAYSTACK_" : "FREE_")) + randomToken(12);
  const prefix = (event.slug.match(/^[a-z]{2,3}/)?.[0] ?? "EV").slice(0, 3).toUpperCase();
  const code = makeCode(prefix);
  const ticketCode = "TKT-" + randomToken(8);
  const reservationExpiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

  const { getAttendeeSession } = await import("@/lib/attendee");
  const session = await getAttendeeSession();
  let attendeeId = session?.attendeeId ?? null;

  let isWaitlisted = false;
  let finalRequiresPayment = requiresPayment && !isDoorPayment;

  try {
    let result;
    try {
      result = await db.transaction(async tx => {
      if (ticket) {
        await tx.execute(sql`SELECT id FROM ticket_types WHERE id = ${ticket.id} FOR UPDATE`);

        const active = await tx.execute(sql`SELECT COUNT(*)::int AS count FROM ticket_reservations WHERE ticket_type_id = ${ticket.id} AND status = 'reserved' AND expires_at > NOW()`);
        const reservedCount = Number((active.rows[0] as { count: number | string }).count);

        const locked = await tx.select().from(ticketTypes).where(eq(ticketTypes.id, ticket.id)).limit(1).then(r => r[0]);
        if (!locked) throw new Error("TICKET_NOT_FOUND");

        // Need capacity for primary + any guests using this ticket
        const neededForThisTicket = 1 + validGuests.filter(g => (g.ticketTypeId || ticket.id) === ticket.id).length;
        if (locked.capacity > 0 && locked.sold + reservedCount + neededForThisTicket - 1 > locked.capacity) {
          if (locked.hasWaitlist) {
            isWaitlisted = true;
            finalRequiresPayment = false;
          } else {
            throw new Error("TICKET_CAPACITY");
          }
        }
      }

      const [attendee] = await tx.insert(attendees).values({
        organizationId: event.organizationId,
        email,
        firstName,
        lastName,
        phone: String(payload.phone ?? "").trim(),
        city: String(payload.city ?? "").trim(),
        country: String(payload.country ?? event.country),
      }).onConflictDoUpdate({
        target: [attendees.organizationId, attendees.email],
        set: {
          firstName,
          lastName,
          phone: String(payload.phone ?? "").trim(),
          city: String(payload.city ?? "").trim(),
          country: String(payload.country ?? event.country),
        },
      }).returning();

      attendeeId = attendee.id;

      const [created] = await tx.insert(registrations).values({
        eventId: event.id,
        attendeeId,
        ticketTypeId: ticket?.id ?? null,
        code,
        ticketCode,
        firstName,
        lastName,
        email,
        phone: String(payload.phone ?? "").trim(),
        city: String(payload.city ?? "").trim(),
        country: String(payload.country ?? event.country),
        church: String(payload.church ?? "").trim(),
        attendeeType: String(payload.attendeeType ?? "").trim() || "delegate",
        gender: payload.gender ? String(payload.gender).trim() : null,
        ageBracket: payload.ageBracket ? String(payload.ageBracket).trim() : null,
        occupation: payload.occupation ? String(payload.occupation).trim() : null,
        status: isWaitlisted ? "waitlisted" : (finalRequiresPayment ? "pending" : "confirmed"),
        accommodation: payload.accommodation === true,
        accommodationType: payload.accommodationType ? String(payload.accommodationType).trim() : (payload.accommodation === true ? "free" : "none"),
        transport: payload.transport === true,
        dietary: String(payload.dietary ?? "").trim(),
        emergencyName: String(payload.emergencyName ?? "").trim(),
        emergencyPhone: String(payload.emergencyPhone ?? "").trim(),
        amount: primaryBase,
        source: isDoorPayment ? "desk_walkin" : "event_page",
        customAnswers: (() => {
          const raw = payload.customAnswers;
          if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
          const entries = Object.entries(raw as Record<string, unknown>).slice(0, 30);
          return Object.fromEntries(
            entries
              .filter(([, value]) => typeof value === "string")
              .map(([key, value]) => [key.slice(0, 100), String(value).slice(0, 2000)]),
          );
        })(),
        idempotencyKey: idempotencyKey || null,
      }).returning();

      if (!created) throw new Error("REGISTRATION_INSERT_FAILED");

      // Insert all additional guests
      const createdGuests: Array<{
        id: string;
        code: string;
        ticketCode: string;
        firstName: string;
        lastName: string;
        email: string;
        ticketName: string;
        relationship: string | null;
      }> = [];

      for (let i = 0; i < validGuests.length; i++) {
        const g = validGuests[i];
        const gTicket = g.ticketTypeId ? ticketMap.get(g.ticketTypeId) : ticket;
        const gCode = makeCode(prefix);
        const gTicketCode = "TKT-" + randomToken(8);

        const [guestAttendee] = await tx.insert(attendees).values({
          organizationId: event.organizationId,
          email: g.email,
          firstName: g.firstName,
          lastName: g.lastName,
          phone: g.phone,
          city: String(payload.city ?? "").trim(),
          country: String(payload.country ?? event.country),
        }).onConflictDoUpdate({
          target: [attendees.organizationId, attendees.email],
          set: {
            firstName: g.firstName,
            lastName: g.lastName,
            phone: g.phone,
          },
        }).returning();

        const [guestReg] = await tx.insert(registrations).values({
          eventId: event.id,
          attendeeId: guestAttendee.id,
          ticketTypeId: gTicket?.id ?? null,
          code: gCode,
          ticketCode: gTicketCode,
          firstName: g.firstName,
          lastName: g.lastName,
          email: g.email,
          phone: g.phone,
          city: String(payload.city ?? "").trim(),
          country: String(payload.country ?? event.country),
          church: String(payload.church ?? "").trim(),
          attendeeType: "guest",
          gender: g.gender,
          status: isWaitlisted ? "waitlisted" : (finalRequiresPayment ? "pending" : "confirmed"),
          accommodation: false,
          transport: false,
          amount: gTicket?.price ?? 0,
          source: isDoorPayment ? "desk_walkin" : "event_page",
          customAnswers: {
            primaryRegistrationId: created.id,
            relationship: g.relationship || "Family/Guest",
          },
        }).returning();

        if (gTicket && !isWaitlisted) {
          await tx.insert(ticketReservations).values({
            ticketTypeId: gTicket.id,
            eventId: event.id,
            registrationId: guestReg.id,
            status: finalRequiresPayment ? "reserved" : "confirmed",
            expiresAt: reservationExpiresAt,
          });

          if (!finalRequiresPayment) {
            await tx.update(ticketTypes)
              .set({ sold: sql.raw('"sold" + 1') })
              .where(eq(ticketTypes.id, gTicket.id));
          }
        }

        createdGuests.push({
          id: guestReg.id,
          code: guestReg.code,
          ticketCode: guestReg.ticketCode,
          firstName: guestReg.firstName,
          lastName: guestReg.lastName,
          email: guestReg.email,
          ticketName: gTicket?.name ?? "General admission",
          relationship: g.relationship,
        });
      }

      // Record payment for total charged amount
      const [payment] = await tx.insert(payments).values({
        registrationId: created.id,
        eventId: event.id,
        amount,
        currency: event.currency,
        gateway: isDoorPayment ? staffPaymentMethod! : "paystack",
        gatewayReference: reference,
        status: isWaitlisted ? "not_required" : (finalRequiresPayment ? "pending" : "paid"),
        verified: !finalRequiresPayment,
        paidAt: finalRequiresPayment ? null : new Date(),
      }).returning();

      if (ticket) {
        if (!isWaitlisted) {
          await tx.insert(ticketReservations).values({
            ticketTypeId: ticket.id,
            eventId: event.id,
            registrationId: created.id,
            status: finalRequiresPayment ? "reserved" : "confirmed",
            expiresAt: reservationExpiresAt,
          });

          if (!finalRequiresPayment) {
            await tx.update(ticketTypes)
              .set({ sold: sql.raw('"sold" + 1') })
              .where(eq(ticketTypes.id, ticket.id));
          }
        }
      }

      if (payload.followMinistry !== false && email) {
        try {
          const org = await tx
            .select({ id: organizations.id, name: organizations.name })
            .from(organizations)
            .where(eq(organizations.id, event.organizationId))
            .limit(1)
            .then(r => r[0]);

          if (org) {
            await tx.insert(ministryFollowers).values({
              ministryId: org.id,
              ministryName: org.name,
              email,
              phone: String(payload.phone || "").trim() || null,
            }).catch(() => {});
          }
        } catch {}
      }

      // Record any purchased add-on items linked to this registration
      for (const va of validatedAddons) {
        const voucherCode = "VCH-" + randomToken(4);
        await tx.insert(orderItems).values({
          eventId: event.id,
          productId: va.product.id,
          registrationId: created.id,
          paymentId: payment.id,
          orderCode: "ORD-" + randomToken(4),
          customerName: `${firstName} ${lastName}`,
          customerEmail: email,
          customerPhone: String(payload.phone ?? "").trim(),
          productName: va.product.name,
          productType: va.product.type,
          variant: va.variant || null,
          unitPrice: va.product.price,
          quantity: va.quantity,
          totalPrice: va.lineTotal,
          status: finalRequiresPayment ? "pending" : "paid",
          fulfillmentStatus: va.product.type === "digital" ? "ready_for_pickup" : "unfulfilled",
          pickupVoucherCode: voucherCode,
        });

        if (!finalRequiresPayment) {
          if (va.product.stockQuantity >= 0) {
            await tx
              .update(eventProducts)
              .set({
                stockQuantity: Math.max(0, va.product.stockQuantity - va.quantity),
                soldCount: va.product.soldCount + va.quantity,
              })
              .where(eq(eventProducts.id, va.product.id));
          } else {
            await tx
              .update(eventProducts)
              .set({ soldCount: va.product.soldCount + va.quantity })
              .where(eq(eventProducts.id, va.product.id));
          }
        }
      }

      return { created, payment, createdGuests };
      });
    } catch (error) {
      const pgError = error as { code?: string };
      if (idempotencyKey && pgError.code === "23505") {
        const existingByKey = await db
          .select({
            id: registrations.id,
            code: registrations.code,
            ticketCode: registrations.ticketCode,
            status: registrations.status,
            amount: registrations.amount,
            ticketTypeId: registrations.ticketTypeId,
          })
          .from(registrations)
          .where(
            and(
              eq(registrations.eventId, event.id),
              eq(registrations.idempotencyKey, idempotencyKey),
            ),
          )
          .limit(1)
          .then(r => r[0]);

        if (existingByKey) {
          const existingPayment = await db
            .select({
              status: payments.status,
              reference: payments.gatewayReference,
              checkoutUrl: payments.checkoutUrl,
            })
            .from(payments)
            .where(eq(payments.registrationId, existingByKey.id))
            .limit(1)
            .then(r => r[0]);

          return NextResponse.json({
            ok: true,
            reused: true,
            registration: existingByKey,
            payment: existingPayment
              ? {
                  required: existingByKey.amount > 0,
                  status: existingPayment.status,
                  reference: existingPayment.reference,
                  checkoutUrl: existingPayment.checkoutUrl,
                }
              : null,
          });
        }
      }

      throw error;
    }

    let checkoutUrl: string | null = null;

    if (finalRequiresPayment) {
      const organization = await db.select().from(organizations).where(eq(organizations.id, event.organizationId)).limit(1).then(r => r[0]);
      const secretKey = organization?.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY;

      if (!secretKey) {
        await db.update(payments).set({ status: "failed" }).where(eq(payments.id, result.payment.id));
        if (ticket) await db.update(ticketReservations).set({ status: "released" }).where(eq(ticketReservations.registrationId, result.created.id));
        await db.update(registrations).set({ status: "cancelled" }).where(eq(registrations.id, result.created.id));
        return NextResponse.json({ ok: false, error: "Payment gateway is not configured for this organization." }, { status: 500 });
      }

      const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        signal: AbortSignal.timeout(15000),
        method: "POST",
        headers: {
          Authorization: "Bearer " + secretKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100),
          reference,
          metadata: {
            eventId: event.id,
            registrationId: result.created.id,
            ticketTypeId: ticket?.id ?? null,
            guestRegistrationIds: result.createdGuests.map(g => g.id),
            custom_fields: [
              {
                display_name: "Organizer / Ministry",
                variable_name: "organizer_name",
                value: organization?.name || "Event Organizer",
              },
              {
                display_name: "Event",
                variable_name: "event_title",
                value: event.title,
              },
            ],
          },
          callback_url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") + "/e/" + event.slug + "/wallet",
        }),
      });

      const paystackData = await paystackRes.json().catch(() => null);

      if (!paystackRes.ok || !paystackData?.status || !paystackData?.data?.authorization_url) {
        console.error("Paystack initialization failed:", paystackData);
        await db.update(payments).set({ status: "failed" }).where(eq(payments.id, result.payment.id));
        if (ticket) await db.update(ticketReservations).set({ status: "released" }).where(eq(ticketReservations.registrationId, result.created.id));
        await db.update(registrations).set({ status: "cancelled" }).where(eq(registrations.id, result.created.id));
        return NextResponse.json({ ok: false, error: "Could not initialize payment. Please try again." }, { status: 502 });
      }

      checkoutUrl = paystackData.data.authorization_url;
      await db
        .update(payments)
        .set({ checkoutUrl })
        .where(eq(payments.id, result.payment.id));

      if (paystackData.data.reference && paystackData.data.reference !== reference) {
        await db
          .update(payments)
          .set({ gatewayReference: paystackData.data.reference })
          .where(eq(payments.id, result.payment.id));
      }
    }

    if (!finalRequiresPayment && !isWaitlisted) {
      const startsAtFormatted = new Date(event.startsAt).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      });
      const venueFormatted = event.venueName || event.city || "Virtual Event";
      const ticketNameFormatted = ticket?.name || "General Admission";

      const { generateTicketPdf } = await import("@/lib/pdf-ticket");
      const pdfBuffer = await generateTicketPdf(
        result.created.code,
        result.created.ticketCode,
        `${result.created.firstName} ${result.created.lastName}`,
        event.title,
        startsAtFormatted,
        venueFormatted,
        ticketNameFormatted
      );

      await sendTicketConfirmation(result.created.email, {
        attendeeName: result.created.firstName,
        eventName: event.title,
        ticketName: ticketNameFormatted,
        ticketCode: result.created.ticketCode,
        startsAt: startsAtFormatted,
        venueName: venueFormatted,
      }, pdfBuffer);

      const phoneNumber = String(payload.phone ?? "").trim();
      if (phoneNumber) {
        // Dynamic import to avoid holding up the function if not strictly necessary at top level
        const { sendWhatsAppTicket } = await import("@/lib/whatsapp");
        // We don't await this to avoid slowing down the response, or we could await it
        sendWhatsAppTicket(phoneNumber, event.title, result.created.ticketCode, result.created.firstName).catch(console.error);
      }
    }

    const response = NextResponse.json({
      ok: true,
      registration: {
        code: result.created.code,
        ticketCode: result.created.ticketCode,
        firstName: result.created.firstName,
        lastName: result.created.lastName,
        email: result.created.email,
        status: result.created.status,
        amount,
        currency: event.currency,
      },
      guests: result.createdGuests,
      allTickets: [
        {
          code: result.created.code,
          ticketCode: result.created.ticketCode,
          name: `${result.created.firstName} ${result.created.lastName}`,
          ticketName: ticket?.name ?? "General admission",
          email: result.created.email,
        },
        ...result.createdGuests.map((g) => ({
          code: g.code,
          ticketCode: g.ticketCode,
          name: `${g.firstName} ${g.lastName}`,
          ticketName: g.ticketName,
          email: g.email,
          relationship: g.relationship,
        })),
      ],
      event: {
        title: event.title,
        slug: event.slug,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        city: event.city,
      },
      duplicateLikely: Boolean(duplicate),
      payment: {
        required: finalRequiresPayment,
        checkoutUrl,
        baseAmount: totalBaseAmount,
        fee: convenienceFee,
        amount: totalAmountToCharge,
        status: isWaitlisted ? "not_required" : (finalRequiresPayment ? "pending" : (isDoorPayment ? "paid" : "not_required")),
        message: isDoorPayment
          ? staffPaymentMethod === "cash"
            ? "Paid in cash at the registration desk."
            : staffPaymentMethod === "pos"
            ? "Paid via POS terminal at the registration desk."
            : "Complimentary pass granted by organizer."
          : null,
        reservationExpiresAt: finalRequiresPayment ? reservationExpiresAt.toISOString() : null,
      },
    });

    if (session && !session.attendeeId && attendeeId) {
      const { SignJWT } = await import("jose");
      const attendeeSecret = process.env.ATTENDEE_JWT_SECRET;
      if (!attendeeSecret) {
        if (process.env.NODE_ENV === "production") {
          throw new Error("ATTENDEE_JWT_SECRET environment variable is required in production.");
        }
        throw new Error("ATTENDEE_JWT_SECRET is required for attendee sessions.");
      }
      const JWT_SECRET = new TextEncoder().encode(attendeeSecret);
      const token = await new SignJWT({
        email: session.email,
        orgId: session.orgId,
        attendeeId,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(JWT_SECRET);

      response.cookies.set("attendee_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }

    return response;
  } catch (err) {
    if (err instanceof Error && err.message === "TICKET_CAPACITY") {
      return NextResponse.json({ ok: false, error: "That ticket type has just reached capacity. Please choose another ticket type." }, { status: 409 });
    }
    console.error("[selah] registration failed:", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.stack || err.message : String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "selah-registrations" });
}
