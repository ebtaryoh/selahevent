import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Reveal, SectionHead } from "@/components/ui";
import { Sparkles } from "lucide-react";
import { getAllPublicEvents } from "@/lib/data";
import { EventSearch } from "@/components/event-search";

type SearchParams = {
  query?: string;
  city?: string;
  category?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const publicEvents = await getAllPublicEvents(params);

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative isolate overflow-hidden pt-[72px]">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/hero-auditorium.jpg"
            alt="A gathering in a warmly lit auditorium"
            className="object-cover object-[62%_center]"
            priority
            fill
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, rgba(9,32,25,0.96) 0%, rgba(9,32,25,0.9) 32%, rgba(9,32,25,0.68) 56%, rgba(9,32,25,0.42) 100%)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-40"
            style={{
              background:
                "linear-gradient(180deg, rgba(247,243,236,0) 0%, var(--color-parchment) 100%)",
            }}
          />
        </div>

        <div className="mx-auto w-full max-w-[1240px] px-5 py-24 sm:px-8 lg:py-36 text-center">
          <Reveal>
            <div className="mx-auto mb-8 inline-flex items-center gap-2.5 rounded-full border border-[rgba(232,211,166,0.28)] bg-[rgba(232,211,166,0.1)] px-4 py-2 backdrop-blur-md">
              <Sparkles size={14} className="text-brass-light" />
              <span className="eyebrow text-[0.58rem] text-brass-light">
                The Christian Event Marketplace
              </span>
            </div>
          </Reveal>
          
          <Reveal delay={0.1}>
            <h1 className="font-display mx-auto max-w-4xl text-[clamp(2.75rem,7.2vw,5.4rem)] leading-[0.98] font-semibold tracking-[-0.028em] text-parchment">
              Discover Christian Events Around You
            </h1>
          </Reveal>
          
          <Reveal delay={0.2}>
            <p className="mx-auto mt-7 max-w-2xl text-[clamp(1.0625rem,1.7vw,1.28rem)] leading-[1.68] text-[rgba(247,243,236,0.82)]">
              Find and register for church services, conferences, retreats, and worship nights happening in your city.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a href="#events" className="btn btn-brass !px-8 !py-4 !text-[1rem]">
                Browse Events
                <ArrowRight size={17} strokeWidth={2.1} className="ml-2" />
              </a>
              <Link href="/register" className="btn btn-light !px-8 !py-4 !text-[1rem]">
                List Your Event
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Events Grid Section */}
      <section id="events" className="bg-parchment pb-24 sm:pb-32 relative">
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
          
          <EventSearch />

          <div className="mt-20">
            <SectionHead
              eyebrow="Upcoming Events"
              title="Find your next spiritual gathering."
              description="Explore partnered ministries and upcoming Christian events to grow in your faith journey."
            />
          </div>

          {publicEvents.length === 0 ? (
            <Reveal delay={0.2}>
              <div className="mt-14 rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-paper p-12 text-center">
                <h3 className="font-display text-xl font-semibold text-ink">No events found</h3>
                <p className="mt-2 text-warm-600">Check back later for new events.</p>
              </div>
            </Reveal>
          ) : (
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {publicEvents.map(({ event, organization }, i) => (
                <Reveal key={event.id} delay={0.1 * i}>
                  <Link
                    href={`/e/${event.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-paper transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[rgba(192,138,46,0.12)] hover:border-[rgba(192,138,46,0.3)]"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-parchment-deep">
                      {event.coverImage && (
                        <Image
                          src={event.coverImage}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="absolute top-4 left-4 rounded-full bg-paper/95 px-3 py-1 backdrop-blur-md border border-[rgba(22,19,17,0.05)] shadow-sm">
                        <span className="text-[0.65rem] font-bold text-[var(--color-brass-deep)] tracking-wider uppercase">
                          {event.eventType}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-6 relative">
                      <div className="mb-2 flex items-center gap-2 text-[0.75rem] font-semibold text-brass uppercase tracking-wide">
                        <span>{organization.name}</span>
                      </div>
                      
                      <h3 className="font-display mb-3 text-[1.35rem] leading-[1.25] font-semibold text-ink transition-colors duration-300 group-hover:text-[var(--color-brass-deep)]">
                        {event.title}
                      </h3>
                      
                      <p className="mb-6 line-clamp-2 text-[0.925rem] leading-[1.6] text-warm-600">
                        {event.tagline || event.description}
                      </p>

                      <div className="mt-auto space-y-3 border-t border-[rgba(22,19,17,0.08)] pt-5 text-[0.85rem] text-warm-600 font-medium">
                        <div className="flex items-center gap-3">
                          <CalendarDays size={16} className="shrink-0 text-[var(--color-brass)]" />
                          <span>
                            {new Intl.DateTimeFormat("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }).format(new Date(event.startsAt))}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin size={16} className="shrink-0 text-[var(--color-brass)]" />
                          <span className="truncate">
                            {event.venueName}, {event.city}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
