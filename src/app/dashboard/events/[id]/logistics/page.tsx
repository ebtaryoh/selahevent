import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bus, BedDouble, Utensils } from "lucide-react";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrganization, getEventAccommodations, getEventShuttles } from "@/lib/data";
import { DashboardLogisticsManager } from "@/components/dashboard-logistics-manager";

export const dynamic = "force-dynamic";

export default async function EventLogisticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const org = await getOrganization();
  if (!org) return notFound();

  const { id } = await params;
  const event = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.organizationId, org.id)))
    .limit(1)
    .then((r) => r[0]);

  if (!event) return notFound();

  const [accommodations, shuttles] = await Promise.all([
    getEventAccommodations(event.id),
    getEventShuttles(event.id),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/events/${event.id}`}
          className="inline-flex items-center gap-2 text-[0.8125rem] font-semibold text-warm-500 transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} /> Back to {event.title}
        </Link>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brass-deep uppercase tracking-wider">
              <Bus size={14} /> Camp Operations &amp; Welfare
            </div>
            <h1 className="font-display text-3xl font-semibold text-ink mt-1">
              Logistics, Hostels &amp; Bus Shuttles
            </h1>
            <p className="text-warm-500 text-sm mt-1">
              Manage convention hostel blocks, free bus transportation hubs, and dining hall meal voucher scanning for {event.title}.
            </p>
          </div>
        </div>
      </div>

      <DashboardLogisticsManager
        eventId={event.id}
        eventTitle={event.title}
        initialAccommodations={accommodations as any}
        initialShuttles={shuttles as any}
      />
    </div>
  );
}
