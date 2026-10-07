const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const pool = new Pool({ connectionString: envConfig.DATABASE_URL });

async function check() {
  try {
    const res = await pool.query(`SELECT * FROM attendees LIMIT 1`);
    console.log("Attendees table exists!");
  } catch (err) {
    console.error("Error querying attendees:", err.message);
  } finally {
    await pool.end();
  }
}
check();
