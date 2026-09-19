import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();
console.log("URL:", process.env.DATABASE_URL);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
