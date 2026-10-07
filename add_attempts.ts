import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.DATABASE_URL = "postgresql://postgres.jyjpytommpsmqfofbngd:vd99B5ux8t7SUUrP@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

import { db } from "./src/db/index";
import { sql } from "drizzle-orm";

async function run() {
  try {
    await db.execute(sql`ALTER TABLE "otps" ADD COLUMN IF NOT EXISTS "attempts" integer DEFAULT 0 NOT NULL`);
    console.log("Added attempts column to otps table");
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
