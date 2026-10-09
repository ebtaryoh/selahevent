"use server";

import { createHmac } from "crypto";
import { requirePermission } from "@/lib/data";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function generateScannerLink(eventId: string) {
  const actor = await requirePermission("checkin.write");
  if (!actor) {
    throw new Error("Unauthorized");
  }

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    columns: { slug: true }
  });
  if (!event) throw new Error("Event not found");

  const token = createHmac("sha256", process.env.AUTH_SECRET || "default_secret")
    .update(eventId)
    .digest("hex");

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${baseUrl}/e/${event.slug}/scan?token=${token}`;
}
