import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
function read(file) { return fs.readFileSync(path.join(root, file), "utf8"); }
function assertIncludes(file, fragments) {
  const source = read(file);
  for (const fragment of fragments) {
    if (!source.includes(fragment)) throw new Error("Security regression: " + file + " is missing " + fragment);
  }
}
assertIncludes("src/proxy.ts", ["jwtVerify", 'matcher: ["/dashboard/:path*"]']);
assertIncludes("src/app/api/registrations/route.ts", ["enforceRateLimit", "FOR UPDATE", "idempotencyKey", "ticketReservations"]);
assertIncludes("src/app/api/webhooks/paystack/route.ts", ["timingSafeEqual", "x-paystack-signature", "FOR UPDATE", "payment_capacity_review"]);
assertIncludes("src/app/api/events/[id]/scan/route.ts", ['requirePermission("checkin.write")', "organizationId", "checkIns"]);
assertIncludes("src/lib/attendee.ts", ["hashOtp", "attempts", "ATTENDEE_JWT_SECRET"]);
assertIncludes("src/lib/actions.ts", ['requirePermission("events.write")', 'requirePermission("tickets.write")', 'requirePermission("checkin.write")', "ticketReservations"]);
assertIncludes("src/lib/actions/settings.ts", ["validateMediaFile", "BLOB_READ_WRITE_TOKEN"]);
console.log("[security] regression checks passed");
