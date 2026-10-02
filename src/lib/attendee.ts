"use server";

import { db } from "@/db";
import { attendees, otps } from "@/db/schema";
import { eq, and, gt, lt, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { sendEmailOTP } from "@/lib/email";
import { randomInt } from "crypto";
import { hashOtp, normalizeOtpEmail } from "@/lib/otp";
import { headers } from "next/headers";
import { enforceRateLimit, getClientAddress, rateLimitHeaders } from "@/lib/rate-limit";

function getAttendeeJwtSecret(): Uint8Array {
  const secret = process.env.ATTENDEE_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ATTENDEE_JWT_SECRET environment variable is required in production.");
    }
    return new TextEncoder().encode("dev-only-attendee-secret-32-chars!!");
  }
  return new TextEncoder().encode(secret);
}

export async function requestAttendeeOTP(email: string, orgId: string) {
  try {
    const headerStore = await headers();
    const clientAddress = getClientAddress(new Request("http://localhost", { headers: headerStore }));
    const ipLimit = await enforceRateLimit("attendee-otp-ip", clientAddress, 5, 600);
    if (!ipLimit.allowed) {
      return { error: "Too many OTP requests. Please try again later.", rateLimit: rateLimitHeaders(ipLimit) };
    }

    const cleanEmail = normalizeOtpEmail(email);
    const emailLimit = await enforceRateLimit("attendee-otp-email", cleanEmail + ":" + orgId, 3, 600);
    if (!emailLimit.allowed) {
      return { error: "Too many OTP requests for this email. Please try again later.", rateLimit: rateLimitHeaders(emailLimit) };
    }

    // Generate a 6-digit OTP
    const code = randomInt(100000, 1000000).toString();
    const recentOtp = await db.query.otps.findFirst({
      where: and(
        eq(otps.email, cleanEmail),
        eq(otps.organizationId, orgId),
        gt(otps.createdAt, new Date(Date.now() - 60 * 1000)),
      ),
    });
    if (recentOtp) return { error: "Please wait a minute before requesting another code." };
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Save to DB
    await db.insert(otps).values({
      email: cleanEmail,
      organizationId: orgId,
      code: hashOtp(code),
      expiresAt,
    });

    // In a real app, send an email here using Resend, SendGrid, etc.
    // For this prototype, we'll log it to the console so we can use it.
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n\n========================================`);
      console.log(`🔐 ATTENDEE OTP FOR ${email}: ${code}`);
      console.log(`========================================\n\n`);
    }

    await sendEmailOTP(email, code);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to request OTP:", error);
    return { error: "Failed to generate OTP" };
  }
}

export async function verifyAttendeeOTP(email: string, orgId: string, code: string) {
  try {
    const cleanEmail = normalizeOtpEmail(email);
    let attendeeId: string | null = null;

    const otpRecord = await db.query.otps.findFirst({
      where: and(
        eq(otps.email, cleanEmail),
        eq(otps.organizationId, orgId),
      ),
      orderBy: (otps, { desc }) => [desc(otps.createdAt)],
    });

    if (!otpRecord) return { error: "Invalid OTP code" };
    if (new Date() > otpRecord.expiresAt) return { error: "OTP has expired" };
    if (otpRecord.attempts >= 5) return { error: "Too many incorrect attempts. Please request a new code." };

    const codeHash = hashOtp(code);
    if (otpRecord.code !== codeHash) {
      await db.update(otps)
        .set({ attempts: sql`${otps.attempts} + 1` })
        .where(and(eq(otps.id, otpRecord.id), lt(otps.attempts, 5)));
      return { error: "Invalid OTP code" };
    }

    const [consumedOtp] = await db.delete(otps)
      .where(and(eq(otps.id, otpRecord.id), eq(otps.code, codeHash), lt(otps.attempts, 5)))
      .returning({ id: otps.id });
    if (!consumedOtp) return { error: "This code has already been used. Please request a new code." };

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
      .sign(getAttendeeJwtSecret());

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
    const verified = await jwtVerify(token, getAttendeeJwtSecret());
    return verified.payload as { email: string; orgId: string; attendeeId?: string };
  } catch (err) {
    return null;
  }
}

export async function getAttendeeProfile() {
  const session = await getAttendeeSession();
  if (!session || !session.attendeeId) return null;

  const attendee = await db.query.attendees.findFirst({
    where: and(
        eq(attendees.id, session.attendeeId),
        eq(attendees.organizationId, session.orgId),
        eq(attendees.email, session.email),
      ),
  });

  return attendee;
}

export async function logoutAttendee() {
  const cookieStore = await cookies();
  cookieStore.delete("attendee_token");
  return { success: true };
}
