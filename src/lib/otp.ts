import { createHash } from "crypto";

export function normalizeOtpEmail(email: string) {
  return email.toLowerCase().trim();
}

export function hashOtp(code: string) {
  return createHash("sha256").update(code.trim()).digest("hex");
}
