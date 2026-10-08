import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Applying donation columns...");
  try {
    await db.execute(sql`ALTER TABLE "ticket_types" ADD COLUMN IF NOT EXISTS "is_donation" boolean DEFAULT false NOT NULL;`);
    console.log("Successfully added donation column.");
  } catch (error) {
    console.error("Migration failed:", error);
  }
  process.exit(0);
}

main();
