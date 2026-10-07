const fs = require('fs');
const dotenv = require('dotenv');
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) process.env[k] = envConfig[k];

async function check() {
  const { db } = require('./src/db');
  const { organizations } = require('./src/db/schema');
  const orgs = await db.select().from(organizations);
  console.log("Orgs:", orgs.map(o => ({ id: o.id, email: o.email, name: o.name })));
}
check().then(() => process.exit(0));
