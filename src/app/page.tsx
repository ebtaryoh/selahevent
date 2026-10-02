import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Reveal, SectionHead } from "@/components/ui";
import { Sparkles } from "lucide-react";
import { getAllPublicEvents } from "@/lib/data";
import { EventSearch } from "@/components/event-search";
import { formatMoney } from "@/lib/format";
import { getOrgSession } from "@/lib/session";

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
  const session = await getOrgSession();
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Selah",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://selah.events",
    description: "The Christian Event Operating System for churches and ministries.",
  };

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader isSignedIn={!!session} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />

      <main id="main-content">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden pt-[72px]">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/hero-auditorium.jpg"
            alt="A gathering in a warmly lit auditorium"
            className="object-cover object-[62%_center]"
            priority
            fill
            sizes="100vw"
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
                The Christian Event Operating System
              </span>
            </div>
          </Reveal>
          
          <Reveal delay={0.1}>
            <h1 className="font-display mx-auto max-w-4xl text-[clamp(2.75rem,7.2vw,5.4rem)] leading-[0.98] font-semibold tracking-[-0.028em] text-parchment">
              Plan the gathering. Run the moment. Remember what worked.
            </h1>
          </Reveal>
          
          <Reveal delay={0.2}>
            <p className="mx-auto mt-7 max-w-2xl text-[clamp(1.0625rem,1.7vw,1.28rem)] leading-[1.68] text-[rgba(247,243,236,0.82)]">
              Selah brings planning, event pages, registration, payments, teams, check-in and organizational memory into one calm operating system for churches and Christian ministries.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a href="#events" className="btn btn-brass !px-8 !py-4 !text-[1rem]">
                Browse Events
                <ArrowRight size={17} strokeWidth={2.1} className="ml-2" />
              </a>
              <Link href={session ? "/dashboard/events/new" : "/register"} className="btn btn-light !px-8 !py-4 !text-[1rem]">
                List Your Event
              </Link>
            </div>
          </Reveal>
        </div>
      </section>


      {/* Product story */}
      <section id="organizers" className="scroll-mt-24 border-y border-black/[0.07] bg-paper">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-px bg-black/[0.07] sm:grid-cols-4">
          {[
            ["Plan", "Start from a proven event structure."],
            ["Promote", "Publish a page built to convert interest."],
            ["Run", "Coordinate people and check-in live."],
            ["Remember", "Reuse the work your team already did."],
          ].map(([title, body]) => (
            <div key={title} className="bg-paper px-5 py-7 sm:px-7">
              <div className="eyebrow text-[0.54rem] text-brass-deep">{title}</div>
              <p className="mt-2 text-[0.8rem] leading-[1.55] text-warm-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="lifecycle" className="scroll-mt-24 bg-parchment py-24 sm:py-32">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <SectionHead
            index="01"
            eyebrow="The full event lifecycle"
            title={<>One operating system for the whole gathering.</>}
            description="Selah is designed around the work an event team actually does, not a collection of disconnected tools."
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-[20px] border border-black/[0.08] bg-black/[0.08] md:grid-cols-5">
            {[
              ["01", "Plan", "Build from a blueprint instead of a blank screen.", Compass],
              ["02", "Promote", "Give every event a polished public home.", Sparkles],
              ["03", "Register", "Tickets, forms, payments and confirmations.", Ticket],
              ["04", "Run", "Teams, sessions and QR check-in in one command center.", QrCode],
              ["05", "Remember", "Keep what worked and reuse it next time.", CheckCircle2],
            ].map(([step, title, body, Icon], i) => (
              <Reveal key={step as string} delay={i * 0.05}>
                <div className="group h-full bg-paper p-6 transition-colors duration-300 hover:bg-brass-wash sm:p-7">
                  <span className="tnum font-display text-[1.05rem] font-semibold text-brass-deep">{step as string}</span>
                  <div className="mt-10">
                    <Icon size={19} className="text-warm-300 transition-colors group-hover:text-brass-deep" />
                  </div>
                  <h3 className="font-display mt-5 text-[1.3rem] font-semibold text-ink">{title as string}</h3>
                  <p className="mt-3 text-[0.81rem] leading-[1.7] text-warm-500">{body as string}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-cypress py-24 text-parchment sm:py-32">
        <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <SectionHead
              index="02"
              eyebrow="Organization memory"
              title={<>Your next event should not start from zero.</>}
              description="Turn a successful conference, retreat, convention or training program into a reusable blueprint. Keep the learning. Change the details."
              tone="light"
            />
          </Reveal>
          <Reveal delay={0.12} y={28}>
            <div className="rounded-[24px] border border-brass-light/15 bg-white/[0.05] p-3 shadow-2xl">
              <div className="rounded-[18px] bg-paper p-6 text-ink sm:p-8">
                <div className="flex items-center justify-between gap-4 border-b border-black/[0.08] pb-5">
                  <div>
                    <span className="eyebrow text-[0.55rem] text-brass-deep">Blueprint</span>
                    <h3 className="font-display mt-2 text-[1.55rem] font-semibold">Annual Convention</h3>
                  </div>
                  <span className="pill pill-brass">Used 6×</span>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {["Registration & tickets", "Speaker profiles", "Volunteer structure", "Communication timeline", "Check-in gates", "Certificate rules"].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-[11px] bg-parchment p-3.5 text-[0.78rem] font-medium text-warm-600">
                      <CheckCircle2 size={15} className="shrink-0 text-signal-green" />{item}
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between rounded-[12px] bg-cypress px-4 py-3 text-parchment">
                  <span className="text-[0.76rem] text-parchment/60">Next reuse</span>
                  <span className="text-[0.78rem] font-semibold text-brass-light">Create event <ArrowRight size={13} className="ml-1 inline" /></span>
                </div>
              </div>
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
              {publicEvents.map(({ event, organization, minPrice }, i) => (
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
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          style={{
                            objectPosition: (event.media as any[])?.[0]?.focus 
                              ? `${(event.media as any[])[0].focus.x}% ${(event.media as any[])[0].focus.y}%` 
                              : "center"
                          }}
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
                      <div className="mb-2 flex items-center justify-between gap-2 text-[0.75rem] font-semibold text-brass uppercase tracking-wide">
                        <span>{organization.name}</span>
                        <span className="rounded bg-[var(--color-brass-deep)]/10 px-2 py-0.5 text-[var(--color-brass-deep)]">
                          {minPrice === 0 ? "Free" : `From ${formatMoney(minPrice, event.currency)}`}
                        </span>
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

      </main>
      <SiteFooter />
    </div>
  );
}
