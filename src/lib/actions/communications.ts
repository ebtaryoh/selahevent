"use server";

import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrganization } from "@/lib/data";
import { revalidatePath } from "next/cache";

export async function updateCommsPlan(eventId: string, formData: FormData) {
  const org = await getOrganization();
  if (!org) return { error: "Not authenticated" };

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event || event.organizationId !== org.id) {
    return { error: "Event not found or unauthorized" };
  }

  const title = formData.get("title") as string;
  const audience = formData.get("audience") as string;
  const status = formData.get("status") as "draft" | "scheduled" | "sent";
  
  const currentPlan = event.commsPlan || [];
  
  const newPlanItem = {
    id: crypto.randomUUID(),
    title,
    audience,
    status,
    sendAt: new Date(), // Mocked send date
  };

  try {
    await db
      .update(events)
      .set({
        commsPlan: [...currentPlan, newPlanItem],
      })
      .where(eq(events.id, eventId));

    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/dashboard/events/${eventId}/communications`);
    
    return { success: true };
  } catch (dbError: any) {
    console.error("Database Update Error:", dbError);
    return { error: dbError.message || String(dbError) };
  }
}

export async function deleteCommsPlanItem(eventId: string, itemId: string) {
  const org = await getOrganization();
  if (!org) return { error: "Not authenticated" };

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event || event.organizationId !== org.id) {
    return { error: "Event not found or unauthorized" };
  }
  
  const currentPlan = event.commsPlan || [];
  const newPlan = currentPlan.filter(item => item.id !== itemId);

  try {
    await db
      .update(events)
      .set({
        commsPlan: newPlan,
      })
      .where(eq(events.id, eventId));

    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/dashboard/events/${eventId}/communications`);
    
    return { success: true };
  } catch (dbError: any) {
    console.error("Database Update Error:", dbError);
    return { error: dbError.message || String(dbError) };
  }
}
