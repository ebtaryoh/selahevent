import { and, eq, ne, sql } from "drizzle-orm";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  events,
  organizations,
  payments,
  registrations,
  ticketTypes,
  ticketReservations,
} from "@/db/schema";
import { sendTicketConfirmation } from "@/lib/email";

export const dynamic = "force-dynamic";

function signaturesMatch(expected: string, received: string) {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

    let payload: {
      event: string;
      data: { reference?: string; [key: string]: unknown };
    };

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const reference = payload.data?.reference;
    if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });

    const paymentRecord = await db
      .select()
      .from(payments)
      .where(eq(payments.gatewayReference, reference))
      .limit(1)
      .then(r => r[0]);

    if (!paymentRecord) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    if (!paymentRecord.eventId) return NextResponse.json({ error: "Payment missing event association" }, { status: 400 });

    const eventRecord = await db
      .select()
      .from(events)
      .where(eq(events.id, paymentRecord.eventId))
      .limit(1)
      .then(r => r[0]);

    if (!eventRecord) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const organization = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, eventRecord.organizationId))
      .limit(1)
      .then(r => r[0]);

    if (!organization) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const secretKey = organization.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) return NextResponse.json({ error: "Configuration error" }, { status: 500 });

    const expectedSignature = crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex");
    if (!signaturesMatch(expectedSignature, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (payload.event === "charge.success") {
      const payloadAmount = typeof payload.data?.amount === "number" ? payload.data.amount : null;
      const payloadCurrency = typeof payload.data?.currency === "string" ? payload.data.currency.toUpperCase() : null;
      const expectedAmount = paymentRecord.amount * 100;
      const expectedCurrency = paymentRecord.currency.toUpperCase();

      if (payloadAmount !== expectedAmount || payloadCurrency !== expectedCurrency) {
        console.error("Paystack webhook payment mismatch", {
          reference,
          expectedAmount,
          receivedAmount: payloadAmount,
          expectedCurrency,
          receivedCurrency: payloadCurrency,
        });
        return NextResponse.json({ error: "Payment details do not match the registration." }, { status: 400 });
      }

      if (paymentRecord.status === "paid" && paymentRecord.verified) {
        return NextResponse.json({ ok: true });
      }

      let shouldSendConfirmation = false;

      await db.transaction(async tx => {
        const updatedPayment = await tx
          .update(payments)
          .set({ status: "paid", verified: true, paidAt: new Date() })
          .where(and(eq(payments.id, paymentRecord.id), ne(payments.status, "paid")))
          .returning({ id: payments.id });

        if (updatedPayment.length === 0) return;

        if (!paymentRecord.registrationId) return;

        await tx
          .update(registrations)
          .set({ status: "confirmed" })
          .where(eq(registrations.id, paymentRecord.registrationId));

        const reservation = await tx
          .select()
          .from(ticketReservations)
          .where(and(
            eq(ticketReservations.registrationId, paymentRecord.registrationId),
            eq(ticketReservations.status, "reserved")
          ))
          .limit(1)
          .then(r => r[0]);

        const anyReservation = reservation ?? await tx
          .select()
          .from(ticketReservations)
          .where(eq(ticketReservations.registrationId, paymentRecord.registrationId))
          .limit(1)
          .then(r => r[0]);

        if (reservation && reservation.expiresAt > new Date()) {
          await tx
            .update(ticketReservations)
            .set({ status: "confirmed" })
            .where(eq(ticketReservations.id, reservation.id));

          await tx
            .update(ticketTypes)
            .set({ sold: sql.raw('"sold" + 1') })
            .where(eq(ticketTypes.id, reservation.ticketTypeId));
          shouldSendConfirmation = true;
        } else if (anyReservation) {
          await tx
            .update(registrations)
            .set({ status: "payment_capacity_review" })
            .where(and(
              eq(registrations.id, paymentRecord.registrationId),
              ne(registrations.status, "confirmed"),
            ));
        } else {
          await tx
            .update(registrations)
            .set({ status: "payment_capacity_review" })
            .where(and(
              eq(registrations.id, paymentRecord.registrationId),
              ne(registrations.status, "confirmed"),
            ));
        }

      });

      if (shouldSendConfirmation && paymentRecord.registrationId) {
        const updatedRegistration = await db
          .select()
          .from(registrations)
          .where(eq(registrations.id, paymentRecord.registrationId))
          .limit(1)
          .then(r => r[0]);

        if (updatedRegistration) {
          let ticketName = "General Admission";
          if (updatedRegistration.ticketTypeId) {
            const ticket = await db
              .select()
              .from(ticketTypes)
              .where(eq(ticketTypes.id, updatedRegistration.ticketTypeId))
              .limit(1)
              .then(r => r[0]);
            if (ticket) ticketName = ticket.name;
          }

          await sendTicketConfirmation(updatedRegistration.email, {
            attendeeName: updatedRegistration.firstName,
            eventName: eventRecord.title,
            ticketName,
            ticketCode: updatedRegistration.ticketCode,
            startsAt: new Date(eventRecord.startsAt).toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
            }),
            venueName: eventRecord.venueName || eventRecord.city || "Virtual Event",
          });
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (["charge.failed", "charge.abandoned"].includes(payload.event)) {
      if (paymentRecord.status === "paid") return NextResponse.json({ ok: true });

      await db.transaction(async tx => {
        await tx
          .update(payments)
          .set({ status: "failed", verified: false })
          .where(eq(payments.id, paymentRecord.id));

        if (paymentRecord.registrationId) {
          await tx
            .update(registrations)
            .set({ status: "cancelled" })
            .where(eq(registrations.id, paymentRecord.registrationId));

          await tx
            .update(ticketReservations)
            .set({ status: "released" })
            .where(and(
              eq(ticketReservations.registrationId, paymentRecord.registrationId),
              eq(ticketReservations.status, "reserved")
            ));
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
