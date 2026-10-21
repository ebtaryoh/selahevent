import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/data";
import { AttendingPosterGenerator } from "@/components/attending-poster";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ name?: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) return { title: "Event Not Found" };

  return {
    title: `I Will Be Attending ${event.title} · Custom Poster & DP Generator | Selah`,
    description: `Personalize your official social media flyer for ${event.title}. Add your picture and share with friends on WhatsApp and Instagram.`,
  };
}

export default async function PublicAttendingPosterPage({
  params,
  searchParams,
}: Params) {
  const { slug } = await params;
  const query = await searchParams;
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  return (
    <div className="min-h-screen bg-parchment text-ink flex flex-col justify-between selection:bg-brass selection:text-black">
      <SiteHeader />

      <main className="pt-28 pb-20 px-4 sm:px-6 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <Link
              href={`/e/${event.slug}`}
              className="inline-flex items-center gap-2 text-xs font-semibold text-warm-500 hover:text-ink transition-colors"
            >
              <ArrowLeft size={14} /> Back to {event.title}
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
              organizationName: event.organization?.name ?? "Host Ministry",
              coverImage: event.coverImage,
            }}
            defaultName={query?.name || ""}
            isOrganizerView={false}
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
