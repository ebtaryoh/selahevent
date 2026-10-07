import { notFound } from "next/navigation";
import { ArrowLeft, Plus, CalendarDays, Pencil } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { events, sessions } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { getOrganization } from "@/lib/data";

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function SchedulePage({
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

  const eventSessions = await db.query.sessions.findMany({
    where: eq(sessions.eventId, event.id),
    orderBy: [asc(sessions.day), asc(sessions.startsAt)],
  });

  const tracks = [...new Set(eventSessions.map((s) => s.track))];

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
            Event Schedule
          </h1>
        </div>
        <Link
          href={`/dashboard/events/${event.id}/schedule/new`}
          className="btn btn-primary"
        >
          <Plus size={16} /> Add Session
        </Link>
      </header>

      {eventSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-[rgba(22,19,17,0.2)] bg-[rgba(22,19,17,0.02)] py-20 text-center">
          <CalendarDays size={48} className="text-warm-300 mb-4" />
          <h3 className="text-lg font-medium text-ink">No schedule yet</h3>
          <p className="mt-1 text-sm text-warm-500">
            Add sessions to display the itinerary on your event page.
          </p>
          <Link
            href={`/dashboard/events/${event.id}/schedule/new`}
            className="btn btn-primary mt-6"
          >
            <Plus size={16} /> Add Session
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {tracks.map((track) => (
            <div key={track}>
              <h2 className="font-display text-xl font-semibold text-ink mb-4 pb-2 border-b border-[rgba(22,19,17,0.09)]">
                {track}
              </h2>
              <div className="grid gap-4">
                {eventSessions
                  .filter((s) => s.track === track)
                  .map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-[16px] border border-[rgba(22,19,17,0.09)] bg-paper p-5 sm:p-6"
                    >
                      <div className="flex items-start gap-5">
                        <div className="tnum w-[4.5rem] shrink-0 text-[0.805rem] font-semibold text-[var(--color-brass-deep)]">
                          {formatTime(session.startsAt)}
                          <span className="block text-warm-400">
                            {formatTime(session.endsAt)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-display text-[1.125rem] font-semibold text-ink">
                            {session.title}
                          </h3>
                          <div className="mt-1 text-[0.875rem] text-warm-500">
                            Day {session.day} · {session.venue}
                            {session.speakerName && ` · ${session.speakerName}`}
                          </div>
                          {session.description && (
                            <p className="mt-2 text-sm text-warm-600 line-clamp-2">
                              {session.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 pl-4">
                        <Link
                          href={`/dashboard/events/${event.id}/schedule/${session.id}/edit`}
                          className="btn btn-ghost !px-3 !py-1.5 text-[0.8125rem]"
                        >
                          <Pencil size={14} className="mr-1.5" /> Edit
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
