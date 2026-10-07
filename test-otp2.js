const dotenv = require('dotenv');
const fs = require('fs');
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}
// Now run typescript via tsx programmatically? No, we can just spawn a child process or we can use dynamic import.
async function main() {
  const { requestAttendeeOTP } = await import('./src/lib/attendee');
  const { db } = await import('./src/db/index');
  const { organizations } = await import('./src/db/schema');
  
  try {
    const orgs = await db.select().from(organizations).limit(1);
    if (orgs.length === 0) {
        console.log("No orgs found");
        return;
    }
    const orgId = orgs[0].id;
    console.log("Using orgId:", orgId);
    
    const res = await requestAttendeeOTP("test@example.com", orgId);
    console.log("Result:", res);
  } catch(e) {
    console.error("Error:", e);
  }
}
main().then(() => process.exit(0));
