import { notFound } from "next/navigation";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TicketForm } from "@/components/ticket-form";
import { getOrganization } from "@/lib/data";

export default async function NewTicketPage({
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

  return <TicketForm eventId={event.id} currency={org.currency || "NGN"} />;
}
