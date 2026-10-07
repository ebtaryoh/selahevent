const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) process.env[k] = envConfig[k];

async function runTest() {
  const { db } = require('./src/db');
  const { otps } = require('./src/db/schema');
  
  const all = await db.select().from(otps).limit(5);
  console.log("OTPs:", all);
}
runTest().then(() => process.exit(0));
