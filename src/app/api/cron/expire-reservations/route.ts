import { and, eq, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, registrations, ticketReservations } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  try {
    const released = await db.transaction(async tx => {
      const expired = await tx
        .update(ticketReservations)
        .set({ status: "released" })
        .where(and(
          eq(ticketReservations.status, "reserved"),
          lt(ticketReservations.expiresAt, now),
        ))
        .returning({ registrationId: ticketReservations.registrationId });

      const registrationIds = expired
        .map(row => row.registrationId)
        .filter((id): id is string => Boolean(id));

      for (const registrationId of registrationIds) {
        await tx
          .update(registrations)
          .set({ status: "cancelled" })
          .where(and(
            eq(registrations.id, registrationId),
            eq(registrations.status, "pending"),
          ));

        await tx
          .update(payments)
          .set({ status: "failed", verified: false })
          .where(and(
            eq(payments.registrationId, registrationId),
            eq(payments.status, "pending"),
          ));
      }

      return registrationIds.length;
    });

    return NextResponse.json({ ok: true, released });
  } catch (error) {
    console.error("[selah] reservation cleanup failed:", error);
    return NextResponse.json({ ok: false, error: "Cleanup failed" }, { status: 500 });
  }
}
