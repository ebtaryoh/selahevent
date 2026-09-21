import { db } from "./src/db";
import { events } from "./src/db/schema";
import { organizations } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const org = await db.query.organizations.findFirst();
    if (!org) {
      console.log("No org found");
      return;
    }

    const [newEvent] = await db
      .insert(events)
      .values({
        organizationId: org.id,
        slug: "test-slug-12345",
        title: "Test Title",
        eventType: "conference",
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 3600000),
        venueName: "Test Venue",
        city: "Test City",
        description: "Test Desc",
        coverImage: "/images/hero-auditorium.jpg",
        media: [],
        customQuestions: [],
        brandColor: "#c08a2e",
        status: "published",
        visibility: "public",
        readiness: 100,
      })
      .returning();

    console.log("Inserted event:", newEvent.id);
    
    // clean up
    await db.delete(events).where(eq(events.id, newEvent.id));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

run();
