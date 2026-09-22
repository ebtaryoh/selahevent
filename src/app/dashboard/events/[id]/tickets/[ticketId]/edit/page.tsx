import { notFound } from "next/navigation";
import { db } from "@/db";
import { events, ticketTypes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { TicketForm } from "@/components/ticket-form";
import { getOrganization } from "@/lib/data";

export default async function EditTicketPage({
  params,
}: {
  params: Promise<{ id: string; ticketId: string }>;
}) {
  const org = await getOrganization();
  if (!org) return notFound();

  const event = await db.query.events.findFirst({
    where: eq(events.id, (await params).id),
  });

  if (!event || event.organizationId !== org.id) return notFound();

  const ticket = await db.query.ticketTypes.findFirst({
    where: and(
      eq(ticketTypes.id, (await params).ticketId),
      eq(ticketTypes.eventId, event.id)
    ),
  });

  if (!ticket) return notFound();

  return <TicketForm eventId={event.id} ticket={ticket} currency={org.currency || "NGN"} />;
}
