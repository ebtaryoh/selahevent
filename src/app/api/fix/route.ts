import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, ticketTypes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allEvents = await db.select().from(events);
    const eventData = allEvents.map(e => ({ title: e.title, coverImage: e.coverImage, slug: e.slug }));
    
    await db.update(ticketTypes).set({ capacity: 0 }).where(eq(ticketTypes.capacity, 1000));
    
    return NextResponse.json({ success: true, events: eventData });
  } catch (error: any) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
