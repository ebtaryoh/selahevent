"use server";

import { db } from "@/db";
import { events } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getOrganization, requirePermission } from "@/lib/data";
import { revalidatePath } from "next/cache";

export async function updateCommsPlan(eventId: string, formData: FormData) {
  const actor = await requirePermission("communications.write");
  const org = await getOrganization();
  if (!actor) return { error: "You do not have permission to perform this action." };
  if (!org) return { error: "Not authenticated" };

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.organizationId, org.id)),
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
      .where(and(eq(events.id, eventId), eq(events.organizationId, org.id)));

    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/dashboard/events/${eventId}/communications`);
    
    return { success: true };
  } catch (dbError: any) {
    console.error("Database Update Error:", dbError);
    return { error: dbError.message || String(dbError) };
  }
}

export async function deleteCommsPlanItem(eventId: string, itemId: string) {
  const actor = await requirePermission("communications.write");
  const org = await getOrganization();
  if (!actor) return { error: "You do not have permission to perform this action." };
  if (!org) return { error: "Not authenticated" };

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.organizationId, org.id)),
  });

  if (!event) {
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
      .where(and(eq(events.id, eventId), eq(events.organizationId, org.id)));

    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/dashboard/events/${eventId}/communications`);
    
    return { success: true };
  } catch (dbError: any) {
    console.error("Database Update Error:", dbError);
    return { error: dbError.message || String(dbError) };
  }
}
