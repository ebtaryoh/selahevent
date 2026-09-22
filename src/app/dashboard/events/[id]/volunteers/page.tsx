import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Users, Pencil, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { events, volunteers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getOrganization } from "@/lib/data";

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
            Volunteers
          </h1>
        </div>
        <Link
          href={`/dashboard/events/${event.id}/volunteers/new`}
          className="btn btn-primary"
        >
          <Plus size={16} /> Add Volunteer
        </Link>
      </header>

      {eventVolunteers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-[rgba(22,19,17,0.2)] bg-[rgba(22,19,17,0.02)] py-20 text-center">
          <Users size={48} className="text-warm-300 mb-4" />
          <h3 className="text-lg font-medium text-ink">No volunteers added</h3>
          <p className="mt-1 text-sm text-warm-500">
            Keep track of your event workforce here.
          </p>
          <Link
            href={`/dashboard/events/${event.id}/volunteers/new`}
            className="btn btn-primary mt-6"
          >
            <Plus size={16} /> Add Volunteer
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {eventVolunteers.map((volunteer) => (
            <div
              key={volunteer.id}
              className={`flex flex-col rounded-[16px] border border-[rgba(22,19,17,0.09)] bg-paper p-6 transition-all ${
                volunteer.status === "declined" ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-[1.125rem] font-semibold text-ink flex items-center gap-2">
                    {volunteer.name}
                    {volunteer.isLeader && (
                      <BadgeCheck size={16} className="text-[var(--color-brass-deep)]" />
                    )}
                  </h3>
                  <div className="text-[0.875rem] text-warm-500 mt-1">
                    {volunteer.role} · {volunteer.department}
                  </div>
                </div>
                <span className={`pill text-xs ${
                  volunteer.status === 'confirmed' ? 'pill-green' : 
                  volunteer.status === 'pending' ? 'pill-neutral' : 'pill-neutral opacity-50'
                }`}>
                  {volunteer.status}
                </span>
              </div>

              {(volunteer.phone || volunteer.shift) && (
                <div className="mt-4 text-sm text-warm-600 space-y-1">
                  {volunteer.phone && <div><span className="font-medium text-ink">Phone:</span> {volunteer.phone}</div>}
                  {volunteer.shift && <div><span className="font-medium text-ink">Shift:</span> {volunteer.shift}</div>}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-[rgba(22,19,17,0.09)] flex items-center justify-end">
                <Link
                  href={`/dashboard/events/${event.id}/volunteers/${volunteer.id}/edit`}
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
