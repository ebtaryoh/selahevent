import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { db } from "@/db";
import { events } from "@/db/schema";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://selah.example.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let publicEvents: { slug: string; updatedAt: Date }[] = [];

  try {
    publicEvents = await db
      .select({ slug: events.slug, updatedAt: events.updatedAt })
      .from(events)
      .where(eq(events.visibility, "public"));
  } catch {
    publicEvents = [];
  }

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...publicEvents.map((event) => ({
      url: `${SITE_URL}/e/${event.slug}`,
      lastModified: event.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
