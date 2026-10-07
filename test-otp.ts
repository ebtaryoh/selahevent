import { requestAttendeeOTP } from "./src/lib/attendee";
import { db } from "./src/db";
import { organizations } from "./src/db/schema";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
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
