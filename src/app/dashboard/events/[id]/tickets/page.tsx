import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Ticket, Pencil } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { events, ticketTypes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatMoney } from "@/lib/format";
import { getOrganization } from "@/lib/data";

export default async function TicketsPage({
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

  const tickets = await db.query.ticketTypes.findMany({
    where: eq(ticketTypes.eventId, event.id),
    orderBy: desc(ticketTypes.createdAt),
  });

  return (
    <div className="max-w-[54rem]">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/events/${event.id}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(22,19,17,0.11)] transition-colors hover:bg-[rgba(22,19,17,0.04)]"
          >
            <ArrowLeft size={16} className="text-ink" />
          </Link>
          <h1 className="font-display text-[1.75rem] font-semibold text-ink">
            Ticket Types
          </h1>
        </div>
        <Link
          href={`/dashboard/events/${event.id}/tickets/new`}
          className="btn btn-primary"
        >
          <Plus size={16} /> New Ticket
        </Link>
      </header>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-[rgba(22,19,17,0.2)] bg-[rgba(22,19,17,0.02)] py-20 text-center">
          <Ticket size={48} className="text-warm-300 mb-4" />
          <h3 className="text-lg font-medium text-ink">No ticket types</h3>
          <p className="mt-1 text-sm text-warm-500">
            Create a ticket type to start accepting registrations.
          </p>
          <Link
            href={`/dashboard/events/${event.id}/tickets/new`}
            className="btn btn-primary mt-6"
          >
            <Plus size={16} /> Create Ticket
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`flex flex-col rounded-[16px] border border-[rgba(22,19,17,0.09)] bg-paper p-6 transition-all ${
                !ticket.isVisible ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-[1.125rem] font-semibold text-ink">
                    {ticket.name}
                  </h3>
                  <div className="text-[0.875rem] text-warm-500 mt-1 line-clamp-2">
                    {ticket.description || "No description"}
                  </div>
                </div>
                {!ticket.isVisible && (
                  <span className="pill pill-neutral shrink-0 text-xs">
                    Hidden
                  </span>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-warm-600">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-ink">
                    {ticket.price === 0 ? "Free" : formatMoney(ticket.price, ticket.currency)}
                  </span>
                </div>
                <div className="h-1 w-1 rounded-full bg-warm-300" />
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-ink">
                    {ticket.capacity === 0 ? "Unlimited" : ticket.capacity.toLocaleString()}
                  </span>
                  {" capacity"}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[rgba(22,19,17,0.09)] flex items-center justify-between">
                <div className="text-[0.8125rem] text-warm-500">
                  <strong className="text-ink font-medium">{ticket.sold.toLocaleString()}</strong> sold
                </div>
                <Link
                  href={`/dashboard/events/${event.id}/tickets/${ticket.id}/edit`}
                  className="btn btn-ghost !px-3 !py-1.5 text-[0.8125rem]"
                >
                  <Pencil size={14} className="mr-1.5" /> Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
