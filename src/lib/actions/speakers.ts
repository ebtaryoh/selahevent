"use server";

import { db } from "@/db";
import { events, speakers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrganization } from "@/lib/data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSpeaker(eventId: string, formData: FormData) {
  const org = await getOrganization();
  if (!org) return { error: "Not authenticated" };

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event || event.organizationId !== org.id) {
    return { error: "Event not found or unauthorized" };
  }

  const name = formData.get("name") as string;
  const role = (formData.get("role") as string) || "";
  const organization = (formData.get("organization") as string) || "";
  const bio = (formData.get("bio") as string) || "";
  const topic = (formData.get("topic") as string) || "";
  
  let redirectUrl = "";
  try {
    await db.insert(speakers).values({
      eventId,
      organizationId: org.id,
      name,
      role,
      organization,
      bio,
      topic,
    });

    revalidatePath(`/dashboard/events/${eventId}/speakers`);
    revalidatePath(`/e/${event.slug}`);
    
    redirectUrl = `/dashboard/events/${eventId}/speakers`;
  } catch (dbError: any) {
    console.error("Database Insert Error:", dbError);
    return { error: dbError.message || String(dbError) };
  }
  
  if (redirectUrl) {
    redirect(redirectUrl);
  }
}

export async function updateSpeaker(speakerId: string, eventId: string, formData: FormData) {
  const org = await getOrganization();
  if (!org) return { error: "Not authenticated" };

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event || event.organizationId !== org.id) {
    return { error: "Event not found or unauthorized" };
  }

  const name = formData.get("name") as string;
  const role = (formData.get("role") as string) || "";
  const organization = (formData.get("organization") as string) || "";
  const bio = (formData.get("bio") as string) || "";
  const topic = (formData.get("topic") as string) || "";
  
  let redirectUrl = "";
  try {
    await db
      .update(speakers)
      .set({
        name,
        role,
        organization,
        bio,
        topic,
      })
      .where(eq(speakers.id, speakerId));

    revalidatePath(`/dashboard/events/${eventId}/speakers`);
    revalidatePath(`/e/${event.slug}`);
    
    redirectUrl = `/dashboard/events/${eventId}/speakers`;
  } catch (dbError: any) {
    console.error("Database Update Error:", dbError);
    return { error: dbError.message || String(dbError) };
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }
}

export async function deleteSpeaker(speakerId: string, eventId: string) {
  const org = await getOrganization();
  if (!org) return { error: "Not authenticated" };

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event || event.organizationId !== org.id) {
    return { error: "Event not found or unauthorized" };
  }

  let redirectUrl = "";
  try {
    await db.delete(speakers).where(eq(speakers.id, speakerId));

    revalidatePath(`/dashboard/events/${eventId}/speakers`);
    revalidatePath(`/e/${event.slug}`);
    
    redirectUrl = `/dashboard/events/${eventId}/speakers`;
  } catch (dbError: any) {
    console.error("Database Delete Error:", dbError);
    return { error: dbError.message || String(dbError) };
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }
}
