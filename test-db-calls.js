const dotenv = require('dotenv');
const fs = require('fs');
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

async function run() {
  const { db } = await import('./src/db/index.ts');
  const { appUsers } = await import('./src/db/schema.ts');
  
  try {
    const inserted = await db.insert(appUsers).values({
      organizationId: "78456b50-3aea-481a-bd1a-8b5d0d8879a3",
      name: "Tayo martins",
      email: "ibitayo.akinnibosun@gmail.com",
      role: "owner",
      status: "active",
      imageUrl: "https://lh3.googleusercontent.com/a/ACg8ocKOE1jZQAfUX-RYdfPosAKjxH5w8htpdvVtk3V5N_XqsZPIaB1laQ=s96-c"
    }).returning();
    
    console.log("AppUser created successfully:", inserted);
  } catch(e) {
    console.error("ERROR:", e.message || e);
  }
  
  process.exit(0);
}
run();
