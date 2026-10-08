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
          reference, expectedAmount, receivedAmount: payloadAmount, expectedCurrency, receivedCurrency: payloadCurrency,
        });
        return NextResponse.json({ error: "Payment details do not match the registration." }, { status: 400 });
      }

      let shouldSendConfirmation = false;

      await db.transaction(async tx => {
        const lockedPayment = await tx.query.payments.findFirst({
          where: eq(payments.id, paymentRecord.id),
        });
        if (!lockedPayment) throw new Error("PAYMENT_NOT_FOUND");

        await tx.execute(sql`SELECT id FROM payments WHERE id = ${paymentRecord.id} FOR UPDATE`);
        const currentPayment = await tx.query.payments.findFirst({ where: eq(payments.id, paymentRecord.id) });
        if (!currentPayment) throw new Error("PAYMENT_NOT_FOUND");

        if (currentPayment.status !== "paid" || !currentPayment.verified) {
          await tx.update(payments)
            .set({ status: "paid", verified: true, paidAt: currentPayment.paidAt ?? new Date() })
            .where(eq(payments.id, currentPayment.id));
        }

        if (!currentPayment.registrationId) return;

        const registration = await tx.query.registrations.findFirst({
          where: and(eq(registrations.id, currentPayment.registrationId), eq(registrations.eventId, eventRecord.id)),
        });
        if (!registration) return;

        if (registration.status === "confirmed") return;

        if (!registration.ticketTypeId) {
          await tx.update(registrations)
            .set({ status: "confirmed" })
            .where(eq(registrations.id, registration.id));
          shouldSendConfirmation = true;
          return;
        }

        await tx.execute(sql`SELECT id FROM ticket_types WHERE id = ${registration.ticketTypeId} FOR UPDATE`);
        const ticket = await tx.query.ticketTypes.findFirst({ where: eq(ticketTypes.id, registration.ticketTypeId) });
        if (!ticket) {
          await tx.update(registrations).set({ status: "payment_capacity_review" }).where(eq(registrations.id, registration.id));
          return;
        }

        const reservation = await tx.query.ticketReservations.findFirst({
          where: and(eq(ticketReservations.registrationId, registration.id), eq(ticketReservations.status, "reserved")),
        });

        if (!reservation || reservation.expiresAt <= new Date()) {
          await tx.update(ticketReservations)
            .set({ status: "released" })
            .where(and(eq(ticketReservations.registrationId, registration.id), eq(ticketReservations.status, "reserved")));

          await tx.update(registrations)
            .set({ status: "payment_capacity_review" })
            .where(eq(registrations.id, registration.id));
          return;
        }

        const activeReservations = await tx.execute(sql`
          SELECT COUNT(*)::int AS count
          FROM ticket_reservations
          WHERE ticket_type_id = ${ticket.id}
            AND status = 'reserved'
            AND expires_at > NOW()
            AND registration_id <> ${registration.id}
        `);
        const reservedCount = Number((activeReservations.rows[0] as { count: number | string }).count);

        if (ticket.capacity > 0 && ticket.sold + reservedCount >= ticket.capacity) {
          await tx.update(ticketReservations)
            .set({ status: "released" })
            .where(eq(ticketReservations.id, reservation.id));
          await tx.update(registrations)
            .set({ status: "payment_capacity_review" })
            .where(eq(registrations.id, registration.id));
          return;
        }

        await tx.update(ticketReservations)
          .set({ status: "confirmed" })
          .where(and(eq(ticketReservations.id, reservation.id), eq(ticketReservations.status, "reserved")));

        await tx.update(ticketTypes)
          .set({ sold: sql`${ticketTypes.sold} + 1` })
          .where(eq(ticketTypes.id, ticket.id));

        await tx.update(registrations)
          .set({ status: "confirmed" })
          .where(eq(registrations.id, registration.id));
        shouldSendConfirmation = true;
      });

      if (shouldSendConfirmation && paymentRecord.registrationId) {
        const updatedRegistration = await db
          .select()
          .from(registrations)
          .where(and(eq(registrations.id, paymentRecord.registrationId), eq(registrations.eventId, eventRecord.id)))
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

          try {
            const startsAtFormatted = new Date(eventRecord.startsAt).toLocaleString("en-US", {
              weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric",
            });
            const venueFormatted = eventRecord.venueName || eventRecord.city || "Virtual Event";
            
            const { generateTicketPdf } = await import("@/lib/pdf-ticket");
            const pdfBuffer = await generateTicketPdf(
              updatedRegistration.code,
              updatedRegistration.ticketCode,
              `${updatedRegistration.firstName} ${updatedRegistration.lastName}`,
              eventRecord.title,
              startsAtFormatted,
              venueFormatted,
              ticketName
            );

            await sendTicketConfirmation(updatedRegistration.email, {
              attendeeName: updatedRegistration.firstName,
              eventName: eventRecord.title,
              ticketName,
              ticketCode: updatedRegistration.ticketCode,
              startsAt: startsAtFormatted,
              venueName: venueFormatted,
            }, pdfBuffer);
          } catch (emailError) {
            console.error("[selah] payment confirmation email failed:", emailError);
          }
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
