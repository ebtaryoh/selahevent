import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { events, organizations, payments, registrations, ticketTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendTicketConfirmation } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // We only care about charge.success
    if (payload.event !== "charge.success") {
      return NextResponse.json({ ok: true });
    }

    const reference = payload.data.reference;
    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    // Find the payment record
    const paymentRecord = await db
      .select()
      .from(payments)
      .where(eq(payments.gatewayReference, reference))
      .limit(1)
      .then((r) => r[0]);

    if (!paymentRecord) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    
    // If it's already paid, just return ok
    if (paymentRecord.status === "paid" && paymentRecord.verified) {
      return NextResponse.json({ ok: true });
    }

    // Find the organization to get the secret key
    const eventRecord = await db
      .select()
      .from(events)
      .where(eq(events.id, paymentRecord.eventId))
      .limit(1)
      .then((r) => r[0]);
      
    if (!eventRecord) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const organization = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, eventRecord.organizationId))
      .limit(1)
      .then((r) => r[0]);
      
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const secretKey = organization.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY;
    
    if (!secretKey) {
      console.error("Paystack secret key missing for organization:", organization.id);
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // Verify signature
    const hash = crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex");
    if (hash !== signature) {
      console.error("Paystack webhook signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Verification passed, update records
    await db
      .update(payments)
      .set({
        status: "paid",
        verified: true,
        paidAt: new Date(),
      })
      .where(eq(payments.id, paymentRecord.id));

    const [updatedRegistration] = await db
      .update(registrations)
      .set({
        status: "confirmed",
      })
      .where(eq(registrations.id, paymentRecord.registrationId))
      .returning();

    // Send confirmation email
    if (updatedRegistration) {
      // Get ticket details
      let ticketName = "General Admission";
      if (updatedRegistration.ticketTypeId) {
        const ticket = await db
          .select()
          .from(ticketTypes)
          .where(eq(ticketTypes.id, updatedRegistration.ticketTypeId))
          .limit(1)
          .then((r) => r[0]);
        if (ticket) ticketName = ticket.name;
      }
      
      void sendTicketConfirmation(updatedRegistration.email, {
        attendeeName: updatedRegistration.firstName,
        eventName: eventRecord.title,
        ticketName: ticketName,
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
