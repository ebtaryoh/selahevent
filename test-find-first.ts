const fs = require('fs');
const dotenv = require('dotenv');
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) process.env[k] = envConfig[k];

async function check() {
  const { db } = require('./src/db');
  const { appUsers } = require('./src/db/schema');
  const { eq, and } = require('drizzle-orm');

  const email = "ibitayo.akinnibosun@gmail.com";
  const orgId = "78456b50-3aea-481a-bd1a-8b5d0d8879a3";

  try {
    const user = await db.query.appUsers.findFirst({
      where: and(eq(appUsers.organizationId, orgId), eq(appUsers.email, email)),
    });
    console.log("findFirst result:", user);
  } catch (err) {
    console.error("findFirst threw:", err);
  }
}
check().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
