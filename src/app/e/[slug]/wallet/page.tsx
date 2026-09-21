import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/data";
import { getAttendeeSession, getAttendeeProfile } from "@/lib/attendee";
import { AttendeeLogin } from "@/components/attendee-login";
import { db } from "@/db";
import { registrations, events as eventsTable } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Ticket, Calendar, MapPin } from "lucide-react";
import { formatTime, formatRange } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export default async function WalletPage({ params }: Params) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  
  if (!event) {
    notFound();
  }

  const session = await getAttendeeSession();
  
  // They are either not logged in, or logged into a different org
  if (!session || session.orgId !== event.organizationId || !session.attendeeId) {
    return (
      <div 
        className="min-h-screen bg-[var(--color-parchment)] pt-32 pb-20 px-6"
        style={event.brandColor ? {
          '--color-brass': event.brandColor,
          '--color-brass-deep': `color-mix(in srgb, ${event.brandColor}, black 20%)`,
        } as React.CSSProperties : undefined}
      >
        <AttendeeLogin orgId={event.organizationId} />
      </div>
    );
  }

  const profile = await getAttendeeProfile();

  // Fetch their registrations for this org
  const myRegistrations = await db
    .select({
      registration: registrations,
      event: eventsTable,
    })
    .from(registrations)
    .innerJoin(eventsTable, eq(registrations.eventId, eventsTable.id))
    .where(
      and(
        eq(registrations.attendeeId, session.attendeeId),
        eq(eventsTable.organizationId, event.organizationId)
      )
    )
    .orderBy(desc(registrations.createdAt));

  return (
    <div 
      className="min-h-screen bg-[var(--color-parchment)] pt-24 pb-20 px-6"
      style={event.brandColor ? {
        '--color-brass': event.brandColor,
        '--color-brass-deep': `color-mix(in srgb, ${event.brandColor}, black 20%)`,
        '--color-brass-light': `color-mix(in srgb, ${event.brandColor}, white 30%)`,
        '--color-brass-wash': `color-mix(in srgb, ${event.brandColor}, white 85%)`,
      } as React.CSSProperties : undefined}
    >
      <div className="container mx-auto max-w-4xl">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">
              My Tickets
            </h1>
            <p className="text-warm-500 mt-1">
              Welcome back, {profile?.firstName || session.email}
            </p>
          </div>
          <a href={`/e/${event.slug}`} className="btn btn-ghost text-sm">
            Go to Event Page
          </a>
        </div>

        {myRegistrations.length === 0 ? (
          <div className="card p-12 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-warm-200 rounded-full flex items-center justify-center mb-4">
              <Ticket className="text-warm-400 h-8 w-8" />
            </div>
            <h3 className="font-display text-lg font-semibold text-ink">No tickets found</h3>
            <p className="text-warm-500 mt-2 max-w-md mx-auto">
              You haven't registered for any events from this organization yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {myRegistrations.map(({ registration, event: e }) => (
              <div key={registration.id} className="card p-0 overflow-hidden flex flex-col sm:flex-row">
                <div className="bg-[var(--color-brass)] w-full sm:w-5 flex-shrink-0 h-3 sm:h-auto" />
                <div className="p-6 sm:p-8 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgba(22,19,17,0.06)] text-warm-600">
                          {registration.status.toUpperCase()}
                        </span>
                        {registration.ticketTypeId && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cypress/10 text-cypress">
                            {registration.attendeeType.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-xl font-semibold text-ink">
                        {e.title}
                      </h3>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-warm-600">
                          <Calendar size={15} className="text-warm-400" />
                          <span>{formatRange(e.startsAt, e.endsAt)}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-warm-600">
                          <MapPin size={15} className="text-warm-400 mt-0.5 shrink-0" />
                          <span>
                            {e.venueName ?? ""}{e.venueAddress ? `, ${e.venueAddress}` : ""} · {e.city}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-start sm:items-end gap-2 border-t sm:border-t-0 sm:border-l border-[rgba(22,19,17,0.1)] pt-4 sm:pt-0 sm:pl-6 mt-4 sm:mt-0 min-w-[200px]">
                      <div className="text-[0.7rem] uppercase tracking-wider text-warm-400 font-semibold">
                        Ticket Code
                      </div>
                      <div className="font-mono text-lg font-medium text-ink bg-warm-100 px-3 py-1 rounded">
                        {registration.ticketCode}
                      </div>
                      <p className="text-xs text-warm-500 mt-1 max-w-[200px] text-left sm:text-right">
                        Present this code or your email at the event check-in desk.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
