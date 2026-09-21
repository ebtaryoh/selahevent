"use server";

import { db } from "@/db";
import { attendees, otps } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-attendee-key-change-in-prod"
);

export async function requestAttendeeOTP(email: string, orgId: string) {
  try {
    // Generate a 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Save to DB
    await db.insert(otps).values({
      email: email.toLowerCase().trim(),
      organizationId: orgId,
      code,
      expiresAt,
    });

    // In a real app, send an email here using Resend, SendGrid, etc.
    // For this prototype, we'll log it to the console so we can use it.
    console.log(`\n\n========================================`);
    console.log(`🔐 ATTENDEE OTP FOR ${email}: ${code}`);
    console.log(`========================================\n\n`);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to request OTP:", error);
    return { error: "Failed to generate OTP" };
  }
}

export async function verifyAttendeeOTP(email: string, orgId: string, code: string) {
  try {
    const cleanEmail = email.toLowerCase().trim();
    
    // Universal bypass for demo/local dev
    const isMasterCode = process.env.NODE_ENV !== "production" && code === "123456";
    let attendeeId: string | null = null;
    
    if (!isMasterCode) {
      // Find the latest valid OTP
      const otpRecord = await db.query.otps.findFirst({
        where: and(
          eq(otps.email, cleanEmail),
          eq(otps.organizationId, orgId),
          eq(otps.code, code)
        ),
        orderBy: (otps, { desc }) => [desc(otps.createdAt)],
      });

      if (!otpRecord) {
        return { error: "Invalid OTP code" };
      }

      if (new Date() > otpRecord.expiresAt) {
        return { error: "OTP has expired" };
      }
      
      // Clean up used OTPs if real one is used
      await db.delete(otps).where(eq(otps.email, cleanEmail));
    }

    // Check if attendee exists
    let attendee = await db.query.attendees.findFirst({
      where: and(
        eq(attendees.email, cleanEmail),
        eq(attendees.organizationId, orgId)
      ),
    });

    // If attendee doesn't exist, we can't create one fully without their name/details yet,
    // but the registration flow will handle creating/updating the attendee.
    // Wait, if they are logging in from the wallet page, they must exist.
    // If they are logging in from registration, they might just be verifying email.
    
    // Create JWT
    const token = await new SignJWT({ 
      email: cleanEmail,
      orgId: orgId,
      attendeeId: attendee?.id 
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d") // 30 days
      .sign(JWT_SECRET);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("attendee_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return { 
      success: true, 
      attendeeId: attendee?.id,
      hasProfile: !!attendee 
    };
  } catch (error: any) {
    console.error("OTP Verification failed:", error);
    return { error: "Verification failed" };
  }
}

export async function getAttendeeSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("attendee_token")?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as { email: string; orgId: string; attendeeId?: string };
  } catch (err) {
    return null;
  }
}

export async function getAttendeeProfile() {
  const session = await getAttendeeSession();
  if (!session || !session.attendeeId) return null;

  const attendee = await db.query.attendees.findFirst({
    where: eq(attendees.id, session.attendeeId),
  });

  return attendee;
}

export async function logoutAttendee() {
  const cookieStore = await cookies();
  cookieStore.delete("attendee_token");
  return { success: true };
}
