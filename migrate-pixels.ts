import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Applying pixel columns...");
  try {
    await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "meta_pixel_id" text;`);
    await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "google_analytics_id" text;`);
    console.log("Successfully added pixel columns.");
  } catch (error) {
    console.error("Migration failed:", error);
  }
  process.exit(0);
}

main();
