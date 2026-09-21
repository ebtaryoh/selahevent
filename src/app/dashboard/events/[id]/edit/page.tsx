import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CreateEventForm } from "@/components/create-event-form";
import { getOrganization } from "@/lib/data";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function EditEventPage({ params }: Params) {
  const { id } = await params;
  const org = await getOrganization();
  if (!org) redirect("/onboarding");

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.organizationId, org.id)),
  });

  if (!event) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-12">
      <div className="mb-10">
        <Link
          href={`/dashboard/events/${id}`}
          className="mb-4 inline-flex items-center text-sm font-medium text-warm-500 hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Event Command Center
        </Link>
        <h1 className="font-display text-4xl font-semibold text-ink">
          Edit Event
        </h1>
        <p className="mt-2 text-warm-500">
          Update the details and branding for {event.title}.
        </p>
      </div>

      <CreateEventForm initialData={event} />
    </div>
  );
}
