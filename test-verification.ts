const fs = require('fs');
const dotenv = require('dotenv');

// Load env before importing DB or actions
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

// Emulate next/headers (cookies) before importing things that use it
const mockCookies = {
  get: (name) => ({ value: "mock-value" }),
  set: (name, value, options) => { console.log(`Mock Set-Cookie: ${name}=${value}`); },
};
require('next/headers').cookies = () => mockCookies;

async function runTest() {
  const { db } = require('./src/db');
  const { otps, organizations, appUsers } = require('./src/db/schema');
  const { eq, and } = require('drizzle-orm');
  const { verifyOrgOTP } = require('./src/lib/actions');
  const { verifyAttendeeOTP } = require('./src/lib/attendee');
  const { randomInt } = require('crypto');
  const { hashOtp } = require('./src/lib/otp');
  const { sql } = require('drizzle-orm');

  // Let's create an OTP for the main org email and test verifyOrgOTP
  const orgs = await db.select().from(organizations).limit(1);
  if (!orgs.length) return console.log("No orgs");
  
  const email = "ibitayo.akinnibosun@gmail.com";
  const org = orgs[0];
  const rawCode = randomInt(100000, 1000000).toString();
  const codeHash = hashOtp(rawCode);

  await db.insert(otps).values({
    organizationId: org.id,
    email: email,
    code: codeHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  console.log(`Created OTP ${rawCode} for org verification`);

  const formData = new FormData();
  formData.append("email", email);
  formData.append("code", rawCode);

  try {
    const res = await verifyOrgOTP(formData);
    console.log("verifyOrgOTP result:", res);
  } catch (err) {
    console.error("verifyOrgOTP threw error:", err);
  }

  // Now test attendee OTP
  await db.insert(otps).values({
    organizationId: org.id,
    email: email,
    code: codeHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  
  try {
    const res2 = await verifyAttendeeOTP(email, org.id, rawCode);
    console.log("verifyAttendeeOTP result:", res2);
  } catch (err) {
    console.error("verifyAttendeeOTP threw error:", err);
  }
}

runTest().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
