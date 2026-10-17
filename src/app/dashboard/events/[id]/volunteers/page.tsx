import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { events, volunteers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getOrganization } from "@/lib/data";
import { DashboardVolunteersManager } from "@/components/dashboard-volunteers-manager";

export default async function VolunteersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const org = await getOrganization();
  if (!org) return notFound();

  const event = await db.query.events.findFirst({
    where: eq(events.id, (await params).id),
  });

  if (!event || event.organizationId !== org.id) return notFound();

  const eventVolunteers = await db.query.volunteers.findMany({
    where: eq(volunteers.eventId, event.id),
    orderBy: desc(volunteers.createdAt),
  });

  return (
    <div className="max-w-[64rem]">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/events/${event.id}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(22,19,17,0.11)] transition-colors hover:bg-[rgba(22,19,17,0.04)]"
          >
            <ArrowLeft size={16} className="text-ink" />
          </Link>
          <div>
            <h1 className="font-display text-[1.75rem] font-semibold text-ink">
              Ministry Workforce &amp; Volunteers
            </h1>
            <p className="text-xs text-warm-500 mt-0.5">
              Manage departments, shifts, and attendee volunteer signups Decently and in Order.
            </p>
          </div>
        </div>
      </header>

      <DashboardVolunteersManager
        eventId={event.id}
        eventTitle={event.title}
        initialVolunteers={eventVolunteers}
        availableUnits={(event.volunteerUnits as string[]) || undefined}
      />
    </div>
  );
}
