import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import { getEventById, getTickets } from "@/lib/data";
import { EmbedGenerator } from "@/components/embed-generator";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) return { title: "Embed Not Found" };
  return {
    title: `Website Embed: ${event.title} | Selah`,
  };
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const tickets = await getTickets(event.id);

  return (
    <div className="page-enter pt-4 max-w-5xl space-y-6">
      <header className="flex flex-col gap-3">
        <Link
          href={`/dashboard/events/${event.id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-warm-500 hover:text-ink transition-colors w-fit"
        >
          <ArrowLeft size={14} /> Back to Event Overview
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(226,192,115,0.15)] text-[var(--color-brass)]">
                <Globe size={16} />
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
                Website Embed & Buttons
              </h1>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-warm-600 max-w-2xl">
              Integrate <strong className="text-ink">{event.title}</strong> directly into your church or ministry website. Choose between direct action buttons, inline forms, or popup dialogs.
            </p>
          </div>
          <a
            href={`/e/${event.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost text-xs !py-2.5 self-start sm:self-auto"
          >
            Preview Public Page
          </a>
        </div>
      </header>

      <EmbedGenerator
        event={{
          id: event.id,
          title: event.title,
          slug: event.slug,
          city: event.city,
          brandColor: event.brandColor,
        }}
        tickets={tickets.map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          currency: event.currency,
        }))}
      />
    </div>
  );
}
