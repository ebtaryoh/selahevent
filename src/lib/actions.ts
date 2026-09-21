"use server";

import fs from "fs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, ilike, or, and } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  events,
  organizations,
  otps,
  registrations,
  sessions,
  ticketTypes,
  checkIns,
  blueprints,
} from "@/db/schema";
import { getOrganization } from "./data";
import { createOrgSession } from "./session";
import { put } from "@vercel/blob";
import path from "path";
import { ensureSeed } from "./seed";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/** Generate a URL-safe slug and retry up to `maxAttempts` times if it collides. */
async function generateUniqueSlug(base: string, maxAttempts = 5): Promise<string> {
  const baseSlug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  for (let i = 0; i < maxAttempts; i++) {
    const suffix = Math.floor(Math.random() * 9000 + 1000); // 4-digit suffix
    const slug = `${baseSlug}-${suffix}`;
    const existing = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug)).limit(1);
    if (existing.length === 0) return slug;
  }
  // Last resort: timestamp-based slug
  return `${baseSlug}-${Date.now()}`;
}

/** Write a file to disk (local fallback for media uploads). */
function writeFileToDisk(filepath: string, buffer: Buffer): void {
  const dir = path.dirname(filepath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filepath, buffer);
}

/** Insert an audit log entry — fire-and-forget (errors are non-fatal). */
async function logAudit(orgId: string, actor: string, action: string, entity: string, entityId: string, detail: string) {
  try {
    await db.insert(auditLogs).values({ organizationId: orgId, actor, action, entity, entityId, detail });
  } catch (e) {
    console.error("[audit] failed to write log:", e);
  }
}

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

  // Collision-safe slug
  const slug = await generateUniqueSlug(title);

  // Randomly assign one of our premium images
  // Pick a random default cover image from the public folder
  const images = [
    "/images/event-stage.jpg",
    "/images/hero-auditorium.jpg",
    "/images/retreat-landscape.jpg",
  ];
  let coverImage = images[Math.floor(Math.random() * images.length)];

  // Handle Media Uploads
  const mediaFiles = formData.getAll("media") as File[];
  const mediaPaths: { type: "image" | "video"; url: string }[] = [];
  
  if (mediaFiles && mediaFiles.length > 0) {
    for (const file of mediaFiles) {
      if (file.size === 0) continue;

      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const type = file.type.startsWith("video/") ? "video" : "image";

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const blob = await put(filename, file, { access: "public", multipart: true });
          mediaPaths.push({ type, url: blob.url });
        } catch (error) {
          console.error("Vercel Blob upload failed:", error);
          const buffer = Buffer.from(await file.arrayBuffer());
          const filepath = path.join(process.cwd(), "public", "uploads", filename);
          writeFileToDisk(filepath, buffer);
          mediaPaths.push({ type, url: `/uploads/${filename}` });
        }
      } else {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filepath = path.join(process.cwd(), "public", "uploads", filename);
        writeFileToDisk(filepath, buffer);
        mediaPaths.push({ type, url: `/uploads/${filename}` });
      }
    }

    // Set the first uploaded image as the cover image
    if (mediaPaths.length > 0 && mediaPaths[0].type === "image") {
      coverImage = mediaPaths[0].url;
    }
  }

  const customQuestionsRaw = formData.get("customQuestions") as string;
  let customQuestions = [];
  if (customQuestionsRaw) {
    try {
      customQuestions = JSON.parse(customQuestionsRaw);
    } catch (e) {
      console.error("Failed to parse custom questions", e);
    }
  }

  let redirectUrl = "";
  try {
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
        capacity: formData.get("capacity") ? parseInt(formData.get("capacity") as string, 10) : 0,
        coverImage,
        media: mediaPaths,
        customQuestions,
        brandColor: (formData.get("brandColor") as string) || "#c08a2e",
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

    // Audit log
    void logAudit(org.id, org.name, "created event", "event", newEvent.id, `"${newEvent.title}"`);

    redirectUrl = `/dashboard/events/${newEvent.id}/command`;
  } catch (dbError: any) {
    console.error("Database Insert Error:", dbError);
    return { error: dbError.message || String(dbError) };
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }
}

export async function updateEvent(eventId: string, formData: FormData) {
  await ensureSeed();
  const org = await getOrganization();
  if (!org) return { error: "Organization not found" };

  const existingEvent = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!existingEvent || existingEvent.organizationId !== org.id) {
    return { error: "Event not found or unauthorized" };
  }

  const title = formData.get("title") as string;
  const eventType = formData.get("eventType") as string;
  const description = formData.get("description") as string;
  const startsAt = formData.get("startsAt") as string;
  const endsAt = formData.get("endsAt") as string;
  const venueName = formData.get("venueName") as string;
  const city = formData.get("city") as string;

  if (!title || !eventType || !startsAt || !endsAt || !city) {
    return { error: "Missing required fields" };
  }

  let coverImage = existingEvent.coverImage;
  const mediaPaths: { type: "image" | "video"; url: string }[] = Array.isArray(existingEvent.media) 
    ? (existingEvent.media as any) 
    : [];

  const mediaFiles = formData.getAll("media") as File[];
  let hasNewMedia = false;
  
  if (mediaFiles && mediaFiles.length > 0) {
    for (const file of mediaFiles) {
      if (file.size === 0) continue;
      hasNewMedia = true;

      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const type = file.type.startsWith("video/") ? "video" : "image";

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const blob = await put(filename, file, { access: "public", multipart: true });
          mediaPaths.unshift({ type, url: blob.url });
        } catch (error) {
          console.error("Vercel Blob upload failed:", error);
          const buffer = Buffer.from(await file.arrayBuffer());
          const filepath = path.join(process.cwd(), "public", "uploads", filename);
          writeFileToDisk(filepath, buffer);
          mediaPaths.unshift({ type, url: `/uploads/${filename}` });
        }
      } else {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filepath = path.join(process.cwd(), "public", "uploads", filename);
        writeFileToDisk(filepath, buffer);
        mediaPaths.unshift({ type, url: `/uploads/${filename}` });
      }
    }

    if (hasNewMedia && mediaPaths.length > 0 && mediaPaths[0].type === "image") {
      coverImage = mediaPaths[0].url;
    }
  }

  const customQuestionsRaw = formData.get("customQuestions") as string;
  let customQuestions = existingEvent.customQuestions;
  if (customQuestionsRaw) {
    try {
      customQuestions = JSON.parse(customQuestionsRaw);
    } catch (e) {
      console.error("Failed to parse custom questions", e);
    }
  }

  let redirectUrl = "";
  try {
    await db
      .update(events)
      .set({
        title,
        eventType,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        venueName,
        city,
        description,
        capacity: formData.get("capacity") ? parseInt(formData.get("capacity") as string, 10) : 0,
        coverImage,
        media: mediaPaths,
        customQuestions,
        brandColor: (formData.get("brandColor") as string) || existingEvent.brandColor,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId));

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/dashboard/events/${eventId}/edit`);
    revalidatePath(`/e/${existingEvent.slug}`);
    
    redirectUrl = `/dashboard/events/${eventId}`;
  } catch (dbError: any) {
    console.error("Database Update Error:", dbError);
    return { error: dbError.message || String(dbError) };
  }
  
  if (redirectUrl) {
    redirect(redirectUrl);
  }
}

export async function registerOrganization(formData: FormData) {
  await ensureSeed();

  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string).toLowerCase().trim();
  const phone = (formData.get("phone") as string).trim();
  const country = formData.get("country") as string;
  const orgType = formData.get("orgType") as string;

  // Check for duplicate email
  const [existing] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.email, email))
    .limit(1);

  if (existing) {
    return { error: "An organization with this email already exists. Please sign in instead." };
  }

  // Unique org slug
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  let orgSlug = `${baseSlug}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const slugExists = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, orgSlug)).limit(1);
  if (slugExists.length > 0) orgSlug = `${baseSlug}-${Date.now()}`;

  const [newOrg] = await db
    .insert(organizations)
    .values({
      name,
      slug: orgSlug,
      email,
      phone,
      country,
      orgType,
      plan: "growth",
      eventCadence: "monthly",
    })
    .returning();

  // Create a signed session immediately (no OTP needed for new registration)
  await createOrgSession(newOrg.id);

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/**
 * Step 1 of org login — send a 6-digit OTP to the org's registered email.
 * Returns { step: "otp" } on success so the client can show the code input.
 * Throws on unknown email.
 */
export async function loginOrganization(formData: FormData) {
  await ensureSeed();

  const email = (formData.get("email") as string).toLowerCase().trim();

  // Find the org by email
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.email, email))
    .limit(1);

  if (!org) {
    throw new Error("No organization found with this email. Check the address or register a new workspace.");
  }

  // Generate 6-digit OTP
  const code = Math.floor(100_000 + Math.random() * 900_000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(otps).values({ email, organizationId: org.id, code, expiresAt });

  // In production: send via email provider using EMAIL_PROVIDER_API_KEY.
  // In dev: print to console so you can copy it.
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n========================================`);
    console.log(`🔐  ORG LOGIN OTP  |  ${email}`);
    console.log(`    Code: ${code}  (expires in 10 min)`);
    console.log(`========================================\n`);
  }

  return { step: "otp" as const, email };
}

/**
 * Step 2 of org login — verify the OTP code and create a signed session.
 */
export async function verifyOrgOTP(formData: FormData) {
  const email = (formData.get("email") as string).toLowerCase().trim();
  const code = (formData.get("code") as string).trim();

  // Dev bypass: master code "000000" in non-production
  const isMasterCode = process.env.NODE_ENV !== "production" && code === "000000";

  if (!isMasterCode) {
    const otpRecord = await db.query.otps.findFirst({
      where: and(eq(otps.email, email), eq(otps.code, code)),
      orderBy: (otps, { desc }) => [desc(otps.createdAt)],
    });

    if (!otpRecord) {
      return { error: "Invalid code. Please check the code we sent and try again." };
    }

    if (new Date() > otpRecord.expiresAt) {
      return { error: "This code has expired. Please request a new one." };
    }

    // Consume all OTPs for this email
    await db.delete(otps).where(eq(otps.email, email));
  }

  // Find the org
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.email, email))
    .limit(1);

  if (!org) {
    return { error: "Organization not found." };
  }

  await createOrgSession(org.id);

  revalidatePath("/dashboard");
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

  const customAnswersRaw = formData.get("customAnswers") as string;
  let customAnswers = {};
  if (customAnswersRaw) {
    try {
      customAnswers = JSON.parse(customAnswersRaw);
    } catch (e) {
      console.error("Failed to parse custom answers", e);
    }
  }

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
      customAnswers,
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

  // Audit log (non-fatal)
  const reg = await db.query.registrations.findFirst({ where: eq(registrations.id, registrationId) });
  void logAudit(
    org.id,
    "Command Center",
    "checked in attendee",
    "registration",
    registrationId,
    reg ? `${reg.firstName} ${reg.lastName} (${reg.ticketCode})` : registrationId
  );

  revalidatePath(`/dashboard/events/${eventId}/command`);
  revalidatePath(`/dashboard/events/${eventId}`);

  return { success: true };
}

export async function saveEventAsBlueprint(eventId: string, name: string, description?: string) {
  const org = await getOrganization();
  if (!org) {
    return { error: "Organization not found" };
  }

  // Fetch the event with all its relations that form the DNA
  const event = (await db.query.events.findFirst({
    where: eq(events.id, eventId),
    with: {
      ticketTypes: true,
      sessions: true,
    } as any,
  })) as any;

  if (!event) {
    return { error: "Event not found" };
  }

  // Extract the structure
  const structure = {
    title: event.title,
    theme: event.theme,
    tagline: event.tagline,
    description: event.description,
    eventType: event.eventType,
    timezone: event.timezone,
    city: event.city,
    country: event.country,
    mode: event.mode,
    coverImage: event.coverImage,
    brandColor: event.brandColor,
    media: event.media || [],
    customQuestions: event.customQuestions || [],
    ticketTypes: event.ticketTypes.map((t: any) => ({
      name: t.name,
      description: t.description,
      price: t.price,
      capacity: t.capacity,
      type: t.type,
      requiresApproval: t.requiresApproval,
    })),
    sessions: event.sessions ? event.sessions.map((s: any) => ({
      title: s.title,
      description: s.description,
      track: s.track,
      format: s.format,
      capacity: s.capacity,
      durationMinutes: s.durationMinutes,
      // dates are omitted because they change per event
    })) : [],
    volunteers: [], // Placeholder for phase 3
  };

  await db.insert(blueprints).values({
    organizationId: org.id,
    originalEventId: event.id,
    name,
    description,
    structure,
  });

  void logAudit(org.id, org.name, "saved blueprint", "blueprint", event.id, `"${name}" from "${event.title}"`);
  revalidatePath(`/dashboard/blueprints`);

  return { success: true };
}

export async function createEventFromBlueprint(blueprintId: string, overrides: {
  title: string;
  slug: string;
  startsAt: Date;
  endsAt: Date;
  registrationOpensAt?: Date;
  registrationClosesAt?: Date;
  venueName?: string;
  city?: string;
  country?: string;
}) {
  const org = await getOrganization();
  if (!org) {
    return { error: "Organization not found" };
  }

  const blueprint = await db.query.blueprints.findFirst({
    where: and(eq(blueprints.id, blueprintId), eq(blueprints.organizationId, org.id)),
  });

  if (!blueprint) {
    return { error: "Blueprint not found" };
  }

  const s = blueprint.structure as any;

  // Create the event
  const [newEvent] = await db.insert(events).values({
    organizationId: org.id,
    title: overrides.title,
    slug: overrides.slug,
    startsAt: overrides.startsAt,
    endsAt: overrides.endsAt,
    registrationOpensAt: overrides.registrationOpensAt,
    registrationClosesAt: overrides.registrationClosesAt,
    theme: s.theme,
    tagline: s.tagline,
    description: s.description,
    eventType: s.eventType,
    timezone: s.timezone,
    venueName: overrides.venueName,
    city: overrides.city || s.city,
    country: overrides.country || s.country,
    mode: s.mode,
    coverImage: s.coverImage,
    brandColor: s.brandColor,
    media: s.media,
    customQuestions: s.customQuestions,
  }).returning();

  // Create ticket types
  if (s.ticketTypes && s.ticketTypes.length > 0) {
    await db.insert(ticketTypes).values(
      s.ticketTypes.map((t: any) => ({
        eventId: newEvent.id,
        name: t.name,
        description: t.description,
        price: t.price,
        capacity: t.capacity,
        type: t.type,
        requiresApproval: t.requiresApproval,
      }))
    );
  }

  // Create sessions (default starting at the event start time)
  if (s.sessions && s.sessions.length > 0) {
    await db.insert(sessions).values(
      s.sessions.map((sess: any) => ({
        eventId: newEvent.id,
        title: sess.title,
        description: sess.description,
        track: sess.track,
        format: sess.format,
        capacity: sess.capacity,
        startsAt: overrides.startsAt, 
        endsAt: new Date(overrides.startsAt.getTime() + (sess.durationMinutes || 60) * 60000),
      }))
    );
  }

  revalidatePath(`/dashboard/events`);
  revalidatePath(`/dashboard/blueprints`);
  
  return { success: true, eventId: newEvent.id, slug: newEvent.slug };
}

