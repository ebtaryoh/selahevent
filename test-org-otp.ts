const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) process.env[k] = envConfig[k];

const mockCookies = {
  get: (name) => ({ value: "mock-value" }),
  set: (name, value, options) => { console.log(`Mock Set-Cookie: ${name}=${value}`); },
};
require('next/headers').cookies = () => mockCookies;

async function runTest() {
  const { db } = require('./src/db');
  const { otps, organizations } = require('./src/db/schema');
  const { eq } = require('drizzle-orm');
  const { verifyOrgOTP } = require('./src/lib/actions');
  const { randomInt } = require('crypto');
  const { hashOtp } = require('./src/lib/otp');

  const email = "ibitayo.akinnibosun@gmail.com";
  const orgs = await db.select().from(organizations).where(eq(organizations.email, email)).limit(1);
  if (!orgs.length) return console.log("No orgs");
  
  const org = orgs[0];
  const rawCode = randomInt(100000, 1000000).toString();
  const codeHash = hashOtp(rawCode);

  await db.insert(otps).values({
    organizationId: org.id,
    email: email,
    code: codeHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  const formData = new FormData();
  formData.append("email", email);
  formData.append("code", rawCode);

  try {
    const res = await verifyOrgOTP(formData);
    console.log("verifyOrgOTP result:", res);
  } catch (err) {
    console.error("verifyOrgOTP threw error:", err);
  }
}

runTest().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
