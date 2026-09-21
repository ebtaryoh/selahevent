import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Users, Pencil } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { events, speakers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getOrganization } from "@/lib/data";

export default async function SpeakersPage({
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

  const eventSpeakers = await db.query.speakers.findMany({
    where: eq(speakers.eventId, event.id),
    orderBy: desc(speakers.createdAt),
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
            Event Speakers
          </h1>
        </div>
        <Link
          href={`/dashboard/events/${event.id}/speakers/new`}
          className="btn btn-primary"
        >
          <Plus size={16} /> Add Speaker
        </Link>
      </header>

      {eventSpeakers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-[rgba(22,19,17,0.2)] bg-[rgba(22,19,17,0.02)] py-20 text-center">
          <Users size={48} className="text-warm-300 mb-4" />
          <h3 className="text-lg font-medium text-ink">No speakers added</h3>
          <p className="mt-1 text-sm text-warm-500">
            Add speakers to feature them on your event page.
          </p>
          <Link
            href={`/dashboard/events/${event.id}/speakers/new`}
            className="btn btn-primary mt-6"
          >
            <Plus size={16} /> Add Speaker
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {eventSpeakers.map((speaker) => (
            <div
              key={speaker.id}
              className="flex flex-col rounded-[16px] border border-[rgba(22,19,17,0.09)] bg-paper p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-[1.125rem] font-semibold text-ink">
                    {speaker.name}
                  </h3>
                  <div className="text-[0.875rem] text-warm-500 mt-1 line-clamp-1">
                    {speaker.role} {speaker.organization && `at ${speaker.organization}`}
                  </div>
                </div>
              </div>

              {speaker.topic && (
                <div className="mt-4 text-sm text-warm-600">
                  <span className="font-medium text-ink">Topic:</span> {speaker.topic}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-[rgba(22,19,17,0.09)] flex items-center justify-end">
                <Link
                  href={`/dashboard/events/${event.id}/speakers/${speaker.id}/edit`}
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
