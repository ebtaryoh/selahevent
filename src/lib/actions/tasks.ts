"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { tasks, events } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getOrganization, requirePermission } from "../data";
import { ensureSeed } from "../seed";

export async function createTask(formData: FormData) {
  await ensureSeed();
  const actor = await requirePermission("tasks.write");
  const org = await getOrganization();
  if (!actor) return { error: "You do not have permission to manage tasks." };
  if (!org) return { error: "Organization not found" };

  const title = formData.get("title") as string;
  const category = (formData.get("category") as string) || "General";
  const priority = (formData.get("priority") as string) || "normal";
  const assignee = (formData.get("assignee") as string) || "";
  const eventId = (formData.get("eventId") as string) || null;
  const dueAtRaw = formData.get("dueAt") as string;
  
  const dueAt = dueAtRaw ? new Date(dueAtRaw) : null;

  if (eventId) {
    const event = await db.query.events.findFirst({
      where: and(eq(events.id, eventId), eq(events.organizationId, org.id)),
      columns: { id: true },
    });
    if (!event) return { error: "Event not found or unauthorized" };
  }

  if (!title) {
    return { error: "Task title is required" };
  }

  let redirectUrl = "";
  try {
    await db.insert(tasks).values({
      organizationId: org.id,
      eventId,
      title,
      category,
      priority,
      assignee,
      dueAt,
      status: "not_started",
    });

    revalidatePath("/dashboard");
    if (eventId) {
      revalidatePath(`/dashboard/events/${eventId}`);
    }
    
    redirectUrl = "/dashboard";
  } catch (dbError: any) {
    console.error("Database Insert Error:", dbError);
    return { error: dbError.message || String(dbError) };
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }
}
