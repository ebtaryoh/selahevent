import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Applying waitlist columns...");
  try {
    await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "has_waitlist" boolean DEFAULT false NOT NULL;`);
    await db.execute(sql`ALTER TABLE "ticket_types" ADD COLUMN IF NOT EXISTS "has_waitlist" boolean DEFAULT true NOT NULL;`);
    console.log("Successfully added waitlist columns.");
  } catch (error) {
    console.error("Migration failed:", error);
  }
  process.exit(0);
}

main();
