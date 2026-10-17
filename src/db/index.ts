import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const dbUrl: string = databaseUrl;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function createPool(url: string): Pool {
  const isLocal = !url.includes("supabase.com") && !url.includes("neon.tech");
  const p = new Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  p.on("error", (err) => {
    // Prevent unhandled error events from crashing the process when remote poolers close idle sockets
    console.error("[PostgreSQL Pool Background Error]:", err?.message || err);
  });

  return p;
}

export const pool = globalForDb.__arenaNextJsPostgresqlPool ?? createPool(dbUrl);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

import * as schema from "./schema";

export const db = drizzle(pool, { schema });
