const fs = require('fs');
const { Pool } = require('pg');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

async function run() {
  const pool = new Pool({ connectionString: "postgresql://postgres.jyjpytommpsmqfofbngd:vd99B5ux8t7SUUrP@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" });
  
  try {
    console.log("Creating rate_limit_buckets table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rate_limit_buckets (
        key text PRIMARY KEY,
        window_start timestamp with time zone NOT NULL,
        count integer NOT NULL
      );
    `);
    console.log("Table created.");
  } catch (err) {
    console.error("Global error:", err);
  } finally {
    await pool.end();
  }
}

run();
