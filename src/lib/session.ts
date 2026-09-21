import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "selah_session";
const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET environment variable is required in production. " +
          "Generate one with: openssl rand -hex 32"
      );
    }
    // Dev-only fallback — logs a warning so it's visible
    console.warn(
      "[selah] AUTH_SECRET is not set. Using an insecure dev-only secret. " +
        "Add AUTH_SECRET to your .env file."
    );
    return new TextEncoder().encode("dev-only-insecure-secret-32-chars!!");
  }
  return new TextEncoder().encode(secret);
}

export type OrgSessionPayload = {
  orgId: string;
};

/**
 * Signs a JWT and sets the session cookie.
 * Call this after a successful OTP verification or org registration.
 */
export async function createOrgSession(orgId: string): Promise<void> {
  const secret = getSecret();
  const token = await new SignJWT({ orgId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

/**
 * Reads and verifies the session cookie.
 * Returns the payload or null if missing/invalid/expired.
 */
export async function getOrgSession(): Promise<OrgSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.orgId || typeof payload.orgId !== "string") return null;
    return { orgId: payload.orgId as string };
  } catch {
    // Expired, tampered, or otherwise invalid
    return null;
  }
}

/**
 * Clears the session cookie. Use for logout.
 */
export async function deleteOrgSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
