"use server";

import { db } from "@/db";
import { sessions, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "./auth";
import { getOrganization } from "../data";

export async function createSession(eventId: string, formData: FormData) {
  const actor = await requirePermission("events.update");
  const org = await getOrganization();
  if (!actor) return { error: "Forbidden" };
  if (!org) return { error: "Unauthorized" };

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.organizationId, org.id)),
    columns: { id: true },
  });

  if (!event) return { error: "Event not found" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const track = formData.get("track") as string;
  const day = parseInt(formData.get("day") as string, 10);
  const startsAt = new Date(formData.get("startsAt") as string);
  const endsAt = new Date(formData.get("endsAt") as string);
  const venue = formData.get("venue") as string;
  const speakerName = formData.get("speakerName") as string;
  const kind = formData.get("kind") as string;

  if (!title || !startsAt || !endsAt) {
    return { error: "Missing required fields." };
  }

  await db.insert(sessions).values({
    eventId,
    title,
    description: description || "",
    track: track || "Main",
    day: isNaN(day) ? 1 : day,
    startsAt,
    endsAt,
    venue: venue || "Main Hall",
    speakerName: speakerName || null,
    kind: kind || "session",
  });

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/dashboard/events/${eventId}/schedule`);
  return { success: true };
}

export async function updateSession(sessionId: string, eventId: string, formData: FormData) {
  const actor = await requirePermission("events.update");
  const org = await getOrganization();
  if (!actor) return { error: "Forbidden" };
  if (!org) return { error: "Unauthorized" };

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.organizationId, org.id)),
    columns: { id: true },
  });

  if (!event) return { error: "Event not found" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const track = formData.get("track") as string;
  const day = parseInt(formData.get("day") as string, 10);
  const startsAt = new Date(formData.get("startsAt") as string);
  const endsAt = new Date(formData.get("endsAt") as string);
  const venue = formData.get("venue") as string;
  const speakerName = formData.get("speakerName") as string;
  const kind = formData.get("kind") as string;

  if (!title || !startsAt || !endsAt) {
    return { error: "Missing required fields." };
  }

  await db
    .update(sessions)
    .set({
      title,
      description: description || "",
      track: track || "Main",
      day: isNaN(day) ? 1 : day,
      startsAt,
      endsAt,
      venue: venue || "Main Hall",
      speakerName: speakerName || null,
      kind: kind || "session",
    })
    .where(eq(sessions.id, sessionId));

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/dashboard/events/${eventId}/schedule`);
  return { success: true };
}

export async function deleteSession(sessionId: string, eventId: string) {
  const actor = await requirePermission("events.update");
  const org = await getOrganization();
  if (!actor) return { error: "Forbidden" };
  if (!org) return { error: "Unauthorized" };

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.organizationId, org.id)),
    columns: { id: true },
  });

  if (!event) return { error: "Event not found" };

  await db.delete(sessions).where(eq(sessions.id, sessionId));

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/dashboard/events/${eventId}/schedule`);
  return { success: true };
}
