import { notFound } from "next/navigation";
import { getEventById, getOrganization } from "@/lib/data";
import { AttendingPosterGenerator } from "@/components/attending-poster";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) return { title: "Poster Not Found" };
  return {
    title: `Attendance Poster & DP: ${event.title} | Selah`,
    description: `Create and share customized 'I will be attending' social media posters for ${event.title}.`,
  };
}

export default async function DashboardAttendingPosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const org = await getOrganization();

  return (
    <div className="page-enter max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <Link
          href={`/dashboard/events/${event.id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-warm-500 hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} /> Back to Event Command Center
        </Link>
      </div>

      <AttendingPosterGenerator
        event={{
          id: event.id,
          title: event.title,
          slug: event.slug,
          theme: event.theme,
          tagline: event.tagline,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          venueName: event.venueName,
          city: event.city,
          organizationName: org?.name ?? "Event Host Ministry",
          coverImage: event.coverImage,
        }}
        isOrganizerView={true}
      />
    </div>
  );
}
