"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { getOrganization } from "../data";
import { ensureSeed } from "../seed";

export async function createTask(formData: FormData) {
  await ensureSeed();
  const org = await getOrganization();
  if (!org) return { error: "Organization not found" };

  const title = formData.get("title") as string;
  const category = (formData.get("category") as string) || "General";
  const priority = (formData.get("priority") as string) || "normal";
  const assignee = (formData.get("assignee") as string) || "";
  const eventId = (formData.get("eventId") as string) || null;
  const dueAtRaw = formData.get("dueAt") as string;
  
  const dueAt = dueAtRaw ? new Date(dueAtRaw) : null;

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
