import { notFound } from "next/navigation";
import { db } from "@/db";
import { events, volunteers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { VolunteerForm } from "@/components/volunteer-form";
import { getOrganization } from "@/lib/data";

export default async function EditVolunteerPage({
  params,
}: {
  params: Promise<{ id: string; volunteerId: string }>;
}) {
  const org = await getOrganization();
  if (!org) return notFound();

  const event = await db.query.events.findFirst({
    where: eq(events.id, (await params).id),
  });

  if (!event || event.organizationId !== org.id) return notFound();

  const volunteer = await db.query.volunteers.findFirst({
    where: and(
      eq(volunteers.id, (await params).volunteerId),
      eq(volunteers.eventId, event.id)
    ),
  });

  if (!volunteer) return notFound();

  return <VolunteerForm eventId={event.id} volunteer={volunteer} />;
}
