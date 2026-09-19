"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, ilike, or, and } from "drizzle-orm";
import { db } from "@/db";
import { events, ticketTypes, organizations, registrations, checkIns } from "@/db/schema";
import { getOrganization } from "./data";
import { put } from "@vercel/blob";
import path from "path";
import { ensureSeed } from "./seed";

export async function createEvent(formData: FormData) {
  await ensureSeed();
  
  const org = await getOrganization();
  if (!org) {
    throw new Error("Organization not found");
  }

  const title = formData.get("title") as string;
  const eventType = formData.get("eventType") as string;
  const startsAt = formData.get("startsAt") as string;
  const endsAt = formData.get("endsAt") as string;
  const venueName = formData.get("venueName") as string;
  const city = formData.get("city") as string;
  const description = formData.get("description") as string;

  // Simple slug generation
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;

  // Randomly assign one of our premium images
  const images = [
    "/images/hero-auditorium.jpg",
    "/images/event-stage.jpg",
    "/images/retreat-landscape.jpg",
  ];
  const coverImage = images[Math.floor(Math.random() * images.length)];

  // Handle Media Uploads
  const mediaFiles = formData.getAll("media") as File[];
  const mediaPaths: { type: "image" | "video"; url: string }[] = [];
  
  if (mediaFiles && mediaFiles.length > 0) {
    for (const file of mediaFiles) {
      if (file.size === 0) continue;
      
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      
      // Upload to Vercel Blob
      const blob = await put(filename, file, { 
        access: 'public',
        multipart: true
      });
      
      const type = file.type.startsWith("video/") ? "video" : "image";
      mediaPaths.push({ type, url: blob.url });
    }
  }

  // Insert Event
  const [newEvent] = await db
    .insert(events)
    .values({
      organizationId: org.id,
      slug,
      title,
      eventType,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      venueName,
      city,
      description,
      coverImage,
      media: mediaPaths,
      status: "published",
      visibility: "public",
      readiness: 100, // Fully ready for demo
    })
    .returning();

  // Create default General Admission ticket
  await db.insert(ticketTypes).values({
    eventId: newEvent.id,
    name: "General Admission",
    description: "Standard access to the event.",
    price: 0,
    capacity: 1000,
    isVisible: true,
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  
  // Redirect to the new event's command center
  redirect(`/dashboard/events/${newEvent.id}/command`);
}

export async function registerOrganization(formData: FormData) {
  await ensureSeed();
  
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const country = formData.get("country") as string;
  const orgType = formData.get("orgType") as string;
  
  // Simple slug generation
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;

  const [newOrg] = await db
    .insert(organizations)
    .values({
      name,
      slug,
      email,
      phone,
      country,
      orgType,
      plan: "growth", // default free/growth plan
      eventCadence: "monthly",
    })
    .returning();

  // Log them in by setting the cookie
  const cookieStore = await cookies();
  cookieStore.set("selah_org_id", newOrg.id, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  
  // Redirect to their fresh new dashboard
  redirect("/dashboard");
}

export async function loginOrganization(formData: FormData) {
  await ensureSeed();
  
  const email = formData.get("email") as string;
  
  // Find the organization by email
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.email, email))
    .limit(1);

  if (!org) {
    throw new Error("No organization found with this email");
  }

  // Log them in by setting the cookie
  const cookieStore = await cookies();
  cookieStore.set("selah_org_id", org.id, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  
  // Redirect to their dashboard
  redirect("/dashboard");
}

export async function registerAttendee(formData: FormData) {
  const eventId = formData.get("eventId") as string;
  const eventSlug = formData.get("eventSlug") as string;
  const ticketTypeId = formData.get("ticketTypeId") as string;
  
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const church = formData.get("church") as string;

  // Generate unique codes
  const uuid = crypto.randomUUID();
  const ticketCode = `SEL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Find ticket type to ensure it exists and get its price
  const [ticket] = await db
    .select()
    .from(ticketTypes)
    .where(eq(ticketTypes.id, ticketTypeId))
    .limit(1);

  if (!ticket) {
    throw new Error("Invalid ticket selected");
  }

  // Insert registration
  const [newRegistration] = await db
    .insert(registrations)
    .values({
      eventId,
      ticketTypeId,
      code: uuid,
      ticketCode,
      firstName,
      lastName,
      email,
      phone,
      church,
      amount: ticket.price,
      status: "confirmed", // Assuming free for now
      source: "event_page",
    })
    .returning();

  // Redirect to success page with the registration ID
  redirect(`/e/${eventSlug}/register/success?id=${newRegistration.id}`);
}

export async function searchRegistrations(eventId: string, query: string) {
  const org = await getOrganization();
  if (!org) throw new Error("Unauthorized");

  const results = await db
    .select({
      id: registrations.id,
      firstName: registrations.firstName,
      lastName: registrations.lastName,
      email: registrations.email,
      ticketCode: registrations.ticketCode,
      status: registrations.status,
    })
    .from(registrations)
    .where(
      and(
        eq(registrations.eventId, eventId),
        or(
          ilike(registrations.ticketCode, `%${query}%`),
          ilike(registrations.email, `%${query}%`),
          ilike(registrations.firstName, `%${query}%`),
          ilike(registrations.lastName, `%${query}%`)
        )
      )
    )
    .limit(5);

  return results;
}

export async function checkInAttendee(registrationId: string, eventId: string) {
  const org = await getOrganization();
  if (!org) throw new Error("Unauthorized");

  // Check if they are already checked in
  const [existingCheckIn] = await db
    .select()
    .from(checkIns)
    .where(eq(checkIns.registrationId, registrationId))
    .limit(1);

  if (existingCheckIn) {
    return { success: false, error: "Attendee is already checked in!" };
  }

  // Insert the check-in record
  await db.insert(checkIns).values({
    eventId,
    registrationId,
    method: "manual",
    staffName: "Command Center",
    gate: "Main Entrance",
  });

  revalidatePath(`/dashboard/events/${eventId}/command`);
  revalidatePath(`/dashboard/events/${eventId}`);
  
  return { success: true };
}
