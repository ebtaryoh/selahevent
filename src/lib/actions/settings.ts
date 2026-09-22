"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { getOrganization } from "../data";
import { ensureSeed } from "../seed";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

/** Write a file to disk (local fallback for media uploads). */
function writeFileToDisk(filepath: string, buffer: Buffer): void {
  const dir = path.dirname(filepath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filepath, buffer);
}

export async function updateOrganizationSettings(orgId: string, formData: FormData) {
  await ensureSeed();
  
  // Ensure the user is updating their own org
  const sessionOrg = await getOrganization();
  if (!sessionOrg || sessionOrg.id !== orgId) {
    return { error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const country = formData.get("country") as string;
  const currency = formData.get("currency") as string;
  const timezone = formData.get("timezone") as string;
  const website = formData.get("website") as string;
  const primaryColor = formData.get("primaryColor") as string;
  const accentColor = formData.get("accentColor") as string;
  const orgType = formData.get("orgType") as string;
  
  let logoUrl = sessionOrg.logoUrl;
  const avatarFile = formData.get("avatar") as File | null;
  if (avatarFile && avatarFile.size > 0) {
    const filename = `${Date.now()}-avatar-${avatarFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(filename, avatarFile, { access: "public", multipart: true });
        logoUrl = blob.url;
      } catch (error) {
        console.error("Vercel Blob upload failed:", error);
        const buffer = Buffer.from(await avatarFile.arrayBuffer());
        const filepath = path.join(process.cwd(), "public", "uploads", filename);
        writeFileToDisk(filepath, buffer);
        logoUrl = `/uploads/${filename}`;
      }
    } else {
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      const filepath = path.join(process.cwd(), "public", "uploads", filename);
      writeFileToDisk(filepath, buffer);
      logoUrl = `/uploads/${filename}`;
    }
  }

  if (!name || !email) {
    return { error: "Organization name and email are required" };
  }

  try {
    await db
      .update(organizations)
      .set({
        name,
        email,
        phone,
        country,
        currency,
        timezone,
        website,
        primaryColor,
        accentColor,
        orgType,
        logoUrl,
      })
      .where(eq(organizations.id, orgId));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    
    return { success: true };
  } catch (dbError: any) {
    console.error("Database Update Error:", dbError);
    return { error: dbError.message || String(dbError) };
  }
}
