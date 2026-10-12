import { notFound } from "next/navigation";
import { getEventById, getOrganization } from "@/lib/data";
import { VenuePoster } from "@/components/venue-poster";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) return { title: "Poster Not Found" };
  return {
    title: `Venue Poster: ${event.title} | Selah`,
  };
}

export default async function PosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const org = await getOrganization();

  return (
    <div className="page-enter pt-4">
      <VenuePoster
        event={{
          id: event.id,
          title: event.title,
          slug: event.slug,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          venueName: event.venueName,
          venueAddress: event.venueAddress,
          city: event.city,
          organizationName: org?.name ?? "Event Organizer",
          brandColor: event.brandColor,
        }}
      />
    </div>
  );
}
