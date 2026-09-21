import "dotenv/config";
import { db } from "./src/db/index.js";
import { events, ticketTypes } from "./src/db/schema.js";
import { eq } from "drizzle-orm";

async function run() {
  const allEvents = await db.select().from(events);
  console.log("Events:", allEvents.map(e => ({ title: e.title, coverImage: e.coverImage, slug: e.slug })));

  const allTickets = await db.select().from(ticketTypes);
  console.log("Tickets:", allTickets.map(t => ({ name: t.name, capacity: t.capacity })));
  
  // Fix tickets with 1000 capacity
  await db.update(ticketTypes).set({ capacity: 0 }).where(eq(ticketTypes.capacity, 1000));
  console.log("Fixed 1000 capacity tickets to 0");
  
  process.exit(0);
}

run();
