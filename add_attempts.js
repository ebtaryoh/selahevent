const dotenv = require('dotenv');
const fs = require('fs');
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

async function run() {
  const { db } = await import('./src/db/index.ts');
  const { sql } = await import('drizzle-orm');
  
  try {
    await db.execute(sql`ALTER TABLE "otps" ADD COLUMN IF NOT EXISTS "attempts" integer DEFAULT 0 NOT NULL`);
    console.log("Added attempts column to otps table");
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
