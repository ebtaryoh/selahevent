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
  // If the connection string points to Supabase pooler on port 5432 (Session Mode, capped at 15 connections),
  // automatically rewrite to port 6543 (Transaction Mode) to eliminate EMAXCONNSESSION crashes once and for all.
  let cleanUrl = url;
  if (cleanUrl.includes("pooler.supabase.com:5432")) {
    cleanUrl = cleanUrl.replace("pooler.supabase.com:5432", "pooler.supabase.com:6543");
  }

  const isLocal = !cleanUrl.includes("supabase.com") && !cleanUrl.includes("neon.tech");
  const p = new Pool({
    connectionString: cleanUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
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
