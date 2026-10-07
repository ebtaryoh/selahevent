import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });
process.env.DATABASE_URL = "postgresql://postgres.jyjpytommpsmqfofbngd:vd99B5ux8t7SUUrP@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";
console.log("URL:", process.env.DATABASE_URL);
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
