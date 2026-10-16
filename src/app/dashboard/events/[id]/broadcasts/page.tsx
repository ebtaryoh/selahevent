import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Megaphone, Radio } from "lucide-react";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrganization, getEventAnnouncements } from "@/lib/data";
import { DashboardBroadcastsManager } from "@/components/dashboard-broadcasts-manager";

export const dynamic = "force-dynamic";

export default async function EventBroadcastsPage({
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

  // Fetch all announcements (including archived/inactive) for the management dashboard
  const announcements = await getEventAnnouncements(event.id, false);

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
              <Radio size={14} className="text-amber-500 animate-pulse" /> Live Communication &amp; Announcements
            </div>
            <h1 className="font-display text-3xl font-semibold text-ink mt-1">
              Pastoral Broadcasts &amp; Alerts
            </h1>
            <p className="text-warm-500 text-sm mt-1">
              Broadcast urgent schedule shifts, dining hall openings, shuttle departures, and spiritual words instantly across attendee screens and badges for {event.title}.
            </p>
          </div>
        </div>
      </div>

      <DashboardBroadcastsManager
        eventId={event.id}
        initialAnnouncements={announcements as any}
      />
    </div>
  );
}
