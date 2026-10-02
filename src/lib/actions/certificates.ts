"use server";

import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrganization, requirePermission } from "@/lib/data";
import { revalidatePath } from "next/cache";

export async function updateCertificateSettings(eventId: string, formData: FormData) {
  const actor = await requirePermission("certificates.write");
  const org = await getOrganization();
  if (!actor) return { error: "You do not have permission to perform this action." };
  if (!org) return { error: "Not authenticated" };

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event || event.organizationId !== org.id) {
    return { error: "Event not found or unauthorized" };
  }

  const thresholdRaw = formData.get("certificateThreshold");
  let certificateThreshold = 0;
  
  if (thresholdRaw) {
    certificateThreshold = parseInt(thresholdRaw as string, 10);
    if (isNaN(certificateThreshold) || certificateThreshold < 0 || certificateThreshold > 100) {
      return { error: "Invalid attendance threshold. Must be between 0 and 100." };
    }
  }

  try {
    await db
      .update(events)
      .set({
        certificateThreshold,
      })
      .where(eq(events.id, eventId));

    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/dashboard/events/${eventId}/certificates`);
    
    return { success: true };
  } catch (dbError: any) {
    console.error("Database Update Error:", dbError);
    return { error: dbError.message || String(dbError) };
  }
}
