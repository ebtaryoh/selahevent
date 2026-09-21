"use server";

import { db } from "@/db";
import { events, volunteers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrganization } from "@/lib/data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createVolunteer(eventId: string, formData: FormData) {
  const org = await getOrganization();
  if (!org) return { error: "Not authenticated" };

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event || event.organizationId !== org.id) {
    return { error: "Event not found or unauthorized" };
  }

  const name = formData.get("name") as string;
  const department = formData.get("department") as string;
  const role = (formData.get("role") as string) || "Member";
  const shift = (formData.get("shift") as string) || "";
  const phone = (formData.get("phone") as string) || "";
  const status = (formData.get("status") as string) || "confirmed";
  const isLeader = formData.get("isLeader") === "on" || formData.get("isLeader") === "true";
  
  let redirectUrl = "";
  try {
    await db.insert(volunteers).values({
      eventId,
      name,
      department,
      role,
      shift,
      phone,
      status,
      isLeader,
    });

    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/dashboard/events/${eventId}/volunteers`);
    
    redirectUrl = `/dashboard/events/${eventId}/volunteers`;
  } catch (dbError: any) {
    console.error("Database Insert Error:", dbError);
    return { error: dbError.message || String(dbError) };
  }
  
  if (redirectUrl) {
    redirect(redirectUrl);
  }
}

export async function updateVolunteer(volunteerId: string, eventId: string, formData: FormData) {
  const org = await getOrganization();
  if (!org) return { error: "Not authenticated" };

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event || event.organizationId !== org.id) {
    return { error: "Event not found or unauthorized" };
  }

  const name = formData.get("name") as string;
  const department = formData.get("department") as string;
  const role = (formData.get("role") as string) || "Member";
  const shift = (formData.get("shift") as string) || "";
  const phone = (formData.get("phone") as string) || "";
  const status = (formData.get("status") as string) || "confirmed";
  const isLeader = formData.get("isLeader") === "on" || formData.get("isLeader") === "true";
  
  let redirectUrl = "";
  try {
    await db
      .update(volunteers)
      .set({
        name,
        department,
        role,
        shift,
        phone,
        status,
        isLeader,
      })
      .where(eq(volunteers.id, volunteerId));

    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/dashboard/events/${eventId}/volunteers`);
    
    redirectUrl = `/dashboard/events/${eventId}/volunteers`;
  } catch (dbError: any) {
    console.error("Database Update Error:", dbError);
    return { error: dbError.message || String(dbError) };
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }
}

export async function deleteVolunteer(volunteerId: string, eventId: string) {
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
    await db.delete(volunteers).where(eq(volunteers.id, volunteerId));

    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/dashboard/events/${eventId}/volunteers`);
    
    redirectUrl = `/dashboard/events/${eventId}/volunteers`;
  } catch (dbError: any) {
    console.error("Database Delete Error:", dbError);
    return { error: dbError.message || String(dbError) };
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }
}
