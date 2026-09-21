import { notFound } from "next/navigation";
import { db } from "@/db";
import { events, speakers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { SpeakerForm } from "@/components/speaker-form";
import { getOrganization } from "@/lib/data";

export default async function EditSpeakerPage({
  params,
}: {
  params: { id: string; speakerId: string };
}) {
  const org = await getOrganization();
  if (!org) return notFound();

  const event = await db.query.events.findFirst({
    where: eq(events.id, params.id),
  });

  if (!event || event.organizationId !== org.id) return notFound();

  const speaker = await db.query.speakers.findFirst({
    where: and(
      eq(speakers.id, params.speakerId),
      eq(speakers.eventId, event.id)
    ),
  });

  if (!speaker) return notFound();

  return <SpeakerForm eventId={event.id} speaker={speaker} />;
}
