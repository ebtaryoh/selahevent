import { notFound } from "next/navigation";
import { db } from "@/db";
import { events, sessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { SessionForm } from "@/components/session-form";
import { getOrganization } from "@/lib/data";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const org = await getOrganization();
  if (!org) return notFound();

  const { id, sessionId } = await params;

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
  });

  if (!event || event.organizationId !== org.id) return notFound();

  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, sessionId), eq(sessions.eventId, event.id)),
  });

  if (!session) return notFound();

  return <SessionForm eventId={event.id} session={session} />;
}
