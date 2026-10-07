const fs = require('fs');
const dotenv = require('dotenv');
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) process.env[k] = envConfig[k];

async function check() {
  const { db } = require('./src/db');
  const { appUsers } = require('./src/db/schema');
  const users = await db.select().from(appUsers);
  console.log("Users:", users);
}
check().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
