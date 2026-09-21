import { notFound } from "next/navigation";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrganization } from "@/lib/data";
import CommunicationsPageClient from "./page-client";

export default async function CommunicationsPage({
  params,
}: {
  params: { id: string };
}) {
  const org = await getOrganization();
  if (!org) return notFound();

  const event = await db.query.events.findFirst({
    where: eq(events.id, params.id),
  });

  if (!event || event.organizationId !== org.id) return notFound();

  return <CommunicationsPageClient event={event} />;
}
