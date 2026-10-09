import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { sql } from "drizzle-orm";
import { db } from "../src/db";

async function run() {
  try {
    console.log("Creating ticket_reservations table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ticket_reservations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_type_id uuid NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
        event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        registration_id uuid,
        status text NOT NULL DEFAULT 'reserved',
        expires_at timestamp with time zone NOT NULL,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS ticket_reservations_ticket_idx ON ticket_reservations(ticket_type_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS ticket_reservations_event_idx ON ticket_reservations(event_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS ticket_reservations_registration_idx ON ticket_reservations(registration_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS ticket_reservations_active_idx ON ticket_reservations(ticket_type_id, status, expires_at);
    `);
    
    console.log("Success! Created ticket_reservations table.");
    process.exit(0);
  } catch (error) {
    console.error("Error creating table:", error);
    process.exit(1);
  }
}

run();
