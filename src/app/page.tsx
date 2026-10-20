import Image from "next/image";
import { headers } from "next/headers";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Sparkles,
  Ticket,
  Globe,
  Shield,
  Star,
  Compass,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Flame,
  Sun,
  BookOpen,
  Zap,
  MessageSquare,
} from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Reveal, SectionHead } from "@/components/ui";
import { AnimatedHeroTitle } from "@/components/animated-hero-title";
import { getAllPublicEvents } from "@/lib/data";
import { EventSearch } from "@/components/event-search";
import { CategoryGrid } from "@/components/category-grid";
import { formatMoney } from "@/lib/format";
import { getOrgSession } from "@/lib/session";
import { getEventTag, isSeatedEvent } from "@/lib/event-tags";

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

  // Read Vercel's IP geolocation headers for contextual suggestions in city picker
  const headersList = await headers();
  const geoCityHeader = headersList.get("x-vercel-ip-city");
  const geoCity = geoCityHeader ? decodeURIComponent(geoCityHeader) : undefined;

  // Only filter by city if explicitly specified in the query parameters
  const queryParams = { ...params };
  if (!params.city) {
    delete queryParams.city;
  }

  const publicEvents = await getAllPublicEvents(queryParams);
  const session = await getOrgSession();
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Selah",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://selahevent.vercel.app",
    description: "The Christian Event Operating System & Daily Sanctuary for the global church.",
  };

  return (
    <div className="min-h-screen bg-parchment text-ink selection:bg-brass selection:text-black transition-colors duration-300">
      <SiteHeader isSignedIn={!!session} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <main id="main-content">
        {/* ===================== HERO SECTION ===================== */}
        <section className="relative isolate overflow-hidden pt-[135px] pb-32 sm:pt-[150px] sm:pb-36">
          <div className="absolute inset-0 -z-10 bg-parchment-deep transition-colors duration-300">
            <Image
              src="/images/hero-auditorium.jpg"
              alt="A reverent Christian gathering in a warmly lit sanctuary"
              className="object-cover object-[62%_center] opacity-15 dark:opacity-30 mix-blend-luminosity"
              priority
              fill
              sizes="100vw"
            />
            {/* Deep radial gradient to fade out edges into the background without muddying light mode */}
            <div className="absolute inset-0 dark:bg-[radial-gradient(ellipse_at_top,rgba(8,8,10,0.15)_0%,var(--color-parchment-deep)_85%)] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.75)_0%,var(--color-parchment-deep)_92%)]" />
            <div className="grain pointer-events-none absolute inset-0 opacity-[0.25]" />

            {/* Moving Celestial Glowing Orbs with multi-axis drift */}
            <div className="absolute top-[18%] left-[10%] w-[320px] h-[320px] bg-purple-600/10 dark:bg-purple-600/20 blur-[110px] rounded-full animate-celestial dark:mix-blend-screen pointer-events-none" />
            <div
              className="absolute bottom-[20%] right-[10%] w-[420px] h-[420px] bg-brass/15 dark:bg-brass/25 blur-[130px] rounded-full animate-celestial-slow dark:mix-blend-screen pointer-events-none"
              style={{ animationDelay: "2s" }}
            />
            <div
              className="absolute top-[55%] left-[50%] w-[280px] h-[280px] bg-amber-500/10 dark:bg-amber-500/15 blur-[100px] rounded-full animate-celestial-reverse dark:mix-blend-screen pointer-events-none"
              style={{ animationDelay: "4s" }}
            />

            {/* Rotating Sacred Ray Disc behind Hero */}
            <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] pointer-events-none -z-10 opacity-30 select-none animate-ray-spin">
              <svg viewBox="0 0 200 200" className="w-full h-full text-brass">
                <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 6" fill="none" opacity="0.6" />
                <circle cx="100" cy="100" r="74" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" fill="none" opacity="0.4" />
                {Array.from({ length: 16 }).map((_, i) => (
                  <line
                    key={i}
                    x1="100"
                    y1="8"
                    x2="100"
                    y2="28"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    opacity="0.5"
                    transform={`rotate(${i * 22.5} 100 100)`}
                  />
                ))}
              </svg>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 text-center relative z-10">
            {/* Welcoming Scripture Badge */}
            <Reveal>
              <div className="mx-auto mb-6 inline-flex items-center gap-2.5 rounded-full border border-brass/35 bg-brass/10 px-4 py-1.5 backdrop-blur-md shadow-sm">
                <Sparkles size={14} className="text-brass-deep dark:text-brass-light animate-spin" style={{ animationDuration: "12s" }} />
                <span className="eyebrow text-[0.68rem] text-brass-deep dark:text-brass-light tracking-[0.16em] uppercase font-bold">
                  The Christian Event Operating System &amp; Digital Sanctuary
                </span>
              </div>
            </Reveal>

            <AnimatedHeroTitle className="font-display mx-auto max-w-5xl text-[clamp(2.75rem,7vw,5.8rem)] leading-[1.04] font-semibold tracking-[-0.03em] text-ink" />

            <Reveal delay={0.18}>
              <p className="mx-auto mt-6 max-w-2xl text-[clamp(1.05rem,1.6vw,1.25rem)] leading-[1.7] text-warm-600 dark:text-warm-500 font-normal">
                Discover, register, and experience spirit-filled conferences, camp meetings, and holy convocations with offline turnstiles, WhatsApp passes, and reverent digital excellence.
              </p>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={0.25}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                <a
                  href="#events"
                  className="btn btn-brass !rounded-full !px-8 !py-4 !text-[1rem] font-bold shadow-[0_0_35px_rgba(226,192,115,0.35)] hover:shadow-[0_0_50px_rgba(226,192,115,0.55)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  Explore Sacred Convocations
                  <ArrowRight size={17} strokeWidth={2.4} className="ml-2" />
                </a>
                <Link
                  href={session ? "/dashboard/events/new" : "/register"}
                  className="btn btn-ghost !rounded-full !px-8 !py-4 !text-[1rem] border border-brass/35 hover:bg-brass/10 hover:border-brass/50 backdrop-blur-md text-ink transition-all duration-300 font-semibold"
                >
                  Host Ministry Event
                </Link>
                <Link
                  href="/my-tickets"
                  className="btn btn-ghost !rounded-full !px-6 !py-4 !text-[0.925rem] border border-[var(--card-border)] hover:bg-brass/10 backdrop-blur-md text-ink font-semibold transition-all"
                >
                  <Ticket size={16} className="text-brass-deep dark:text-brass mr-1.5" />
                  Find My Pass
                </Link>
              </div>
            </Reveal>

            {/* Streamlined Discovery-First Trust Strip */}
            <Reveal delay={0.32}>
              <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 p-3 sm:p-4 backdrop-blur-xl shadow-lg">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-semibold text-warm-600 dark:text-warm-400">
                  <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-paper/50 border border-[var(--card-border)]">
                    <Zap size={14} className="text-brass shrink-0" />
                    <span>&lt; 50ms Offline Gates</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-paper/50 border border-[var(--card-border)]">
                    <MessageSquare size={14} className="text-emerald-500 shrink-0" />
                    <span>1-Tap WhatsApp Passes</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-paper/50 border border-[var(--card-border)]">
                    <Sparkles size={14} className="text-brass shrink-0" />
                    <span>Daily Sanctuary &amp; Prayer</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-paper/50 border border-[var(--card-border)]">
                    <Star size={14} className="text-brass shrink-0" fill="currentColor" />
                    <span>Verified Ministries</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Sacred Center Ambient Glow */}
          <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-brass/10 blur-[130px] rounded-full pointer-events-none -z-10 animate-sacred-breathe" />
        </section>

        {/* ===================== INFINITE SCRIPTURE & ATTRIBUTES MARQUEE ===================== */}
        <div className="relative z-10 w-full overflow-hidden bg-[var(--banner-bg)] border-y border-[var(--nav-border)] py-4 backdrop-blur-md flex -mt-16 mb-24 transition-colors">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-10">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-10 text-[0.825rem] font-bold tracking-[0.24em] uppercase text-brass-deep dark:text-brass/75"
              >
                <span>Worship in Spirit &amp; Truth</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brass/40" />
                <span>The Living Word</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brass/40" />
                <span>Holy Spirit Fire</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brass/40" />
                <span>Prophetic Impartation</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brass/40" />
                <span>Covenant Fellowship</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brass/40" />
                <span>Intercession &amp; Prayer</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brass/40" />
                <span>Kingdom Stewardship</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brass/40" />
                <span>Global Revival</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brass/40" />
              </div>
            ))}
          </div>
        </div>

        {/* ===================== FEATURES SHOWCASE (KINGDOM ORDER) ===================== */}
        <section className="relative z-20 mx-auto max-w-[1240px] px-5 sm:px-8 pb-32">
          <div className="mb-14 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brass/25 bg-brass/10 px-3.5 py-1 text-xs font-bold text-brass-deep dark:text-brass uppercase tracking-widest mb-3">
              <Sparkles size={12} className="text-brass-deep dark:text-brass-light" />
              <span>Ministry Order &amp; Excellence · 1 Cor 14:40</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
              Built for Holy Gatherings &amp; Kingdom Stewards
            </h2>
            <p className="mt-3 text-base text-warm-600 dark:text-warm-500 font-normal">
              &ldquo;Let all things be done decently and in order.&rdquo; — 1 Corinthians 14:40
            </p>
          </div>

          <Reveal delay={0.3}>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Ticket,
                  title: "Seamless Gate Hospitality",
                  desc: "Instant QR delivery and frictionless check-in with table seating and dorm allocations.",
                  verse: "“Be not forgetful to entertain strangers: for thereby some have entertained angels unawares.” — Hebrews 13:2",
                },
                {
                  icon: Globe,
                  title: "Global Kingdom Reach",
                  desc: "Accept payments locally and internationally with instant verification across currencies.",
                  verse: "“Go ye into all the world, and preach the gospel to every creature.” — Mark 16:15",
                },
                {
                  icon: Shield,
                  title: "Sanctuary Trust & Privacy",
                  desc: "Bank-grade encrypted attendee databases. Ministry data remains private and reverently protected.",
                  verse: "“He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.” — Psalm 91:1",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-xl p-8 hover:border-brass/50 transition-all duration-500 shadow-xl hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brass/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="mb-6 inline-flex h-13 w-13 items-center justify-center rounded-2xl bg-brass/15 text-brass-deep dark:text-brass border border-brass/30 shadow-sm">
                      <f.icon size={24} strokeWidth={1.8} />
                    </div>
                    <h3 className="font-display text-[1.325rem] font-semibold text-ink mb-2.5">
                      {f.title}
                    </h3>
                    <p className="text-warm-600 dark:text-warm-500 leading-relaxed text-[0.925rem] font-normal mb-6">
                      {f.desc}
                    </p>
                    <div className="border-t border-[var(--card-border)] pt-4">
                      <p className="font-display text-xs italic text-brass-deep dark:text-brass-light/85 leading-relaxed font-medium">
                        {f.verse}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ===================== EVENTS GRID SECTION ===================== */}
        <section id="events" className="relative pb-40 bg-parchment-deep pt-28 border-t border-[var(--nav-border)] transition-colors">
          <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
            <Reveal>
              <CategoryGrid />
            </Reveal>

            <Reveal>
              <div className="mb-20">
                <EventSearch defaultGeoCity={geoCity} />
              </div>
            </Reveal>

            <Reveal>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[var(--card-border)] pb-6 mb-14 gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brass-deep dark:text-brass mb-2">
                    <Sparkles size={13} className="text-brass-deep dark:text-brass" />
                    <span>Holy Assembly · Hebrews 10:25</span>
                  </div>
                  <h2 className="font-display text-[2.4rem] leading-none font-semibold text-ink">
                    The Sacred Collection
                  </h2>
                  <p className="mt-3 text-[1.05rem] text-warm-600 dark:text-warm-500 font-normal max-w-xl">
                    &ldquo;Not forsaking the assembling of ourselves together... but exhorting one another.&rdquo;
                  </p>
                </div>
                <div className="flex">
                  <span className="inline-flex items-center gap-2 rounded-full border border-brass/35 bg-brass/15 px-4 py-1.5 text-[0.8rem] text-brass-deep dark:text-brass uppercase tracking-widest font-bold shadow-sm">
                    <Star size={14} className="text-brass-deep dark:text-brass" fill="currentColor" /> Verified Ministries
                  </span>
                </div>
              </div>
            </Reveal>

            {publicEvents.length === 0 ? (
              <Reveal delay={0.2}>
                <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] py-24 text-center backdrop-blur-md shadow-lg">
                  <CalendarDays size={48} className="text-brass/40 mb-6" strokeWidth={1} />
                  <h3 className="font-display text-2xl font-semibold text-ink">No upcoming convocations found</h3>
                  <p className="mt-3 text-warm-500 max-w-sm font-light">
                    We couldn&apos;t find any events matching your selected criteria. Try adjusting your filters or browse All Cities.
                  </p>
                </div>
              </Reveal>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {publicEvents.map(({ event, organization, minPrice }, i) => (
                  <Reveal key={event.id} delay={0.08 * i}>
                    <Link
                      href={`/e/${event.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] hover:border-brass/60"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-parchment-deep">
                        {event.coverImage && (
                          <Image
                            src={event.coverImage}
                            alt={event.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            style={{
                              objectPosition: (event.media as any[])?.[0]?.focus
                                ? `${(event.media as any[])[0].focus.x}% ${(event.media as any[])[0].focus.y}%`
                                : "center",
                            }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-90 transition-opacity duration-300" />

                        {/* Floating Event Tag */}
                        <div className="absolute top-4 left-4 rounded-full bg-black/75 px-3.5 py-1.5 backdrop-blur-md border border-white/15 flex items-center gap-2 shadow-md">
                          <span className="text-[0.65rem] font-bold text-brass tracking-widest uppercase">
                            {getEventTag(event.eventType)}
                          </span>
                          {isSeatedEvent(event.eventType) && (
                            <span className="text-[0.62rem] text-brass-light/90 font-medium border-l border-white/20 pl-2">
                              Table Seating
                            </span>
                          )}
                        </div>

                        {/* Price Tag Overlay - HIGH CONTRAST (Screenshot 2 Fix) */}
                        <div className="absolute top-4 right-4 rounded-full bg-[#09090b]/92 px-3.5 py-1.5 backdrop-blur-md border border-brass/55 shadow-xl">
                          <span className="text-[0.72rem] font-bold text-brass-light tracking-wide">
                            {minPrice === 0 ? "Free Entry" : `From ${formatMoney(minPrice, event.currency)}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col px-7 pb-8 pt-6 relative -mt-8 z-10 bg-[var(--card-bg)] rounded-t-[24px]">
                        <div className="mb-2.5 text-[0.7rem] font-bold text-brass uppercase tracking-widest flex items-center justify-between">
                          <span className="truncate">{organization.name}</span>
                          {organization.isVerified && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-brass/15 border border-brass/30 px-2 py-0.5 text-[0.62rem] text-brass-deep dark:text-brass-light font-bold shrink-0 ml-2"
                              title="Verified Ministry • Official Christian organization verified by Selah Platform"
                            >
                              <CheckCircle2 size={10} className="text-brass" /> Verified
                            </span>
                          )}
                        </div>

                        <h3 className="font-display mb-3 text-[1.45rem] leading-[1.2] font-semibold text-ink transition-colors duration-300 group-hover:text-brass">
                          {event.title}
                        </h3>

                        <p className="mb-6 line-clamp-2 text-[0.925rem] leading-[1.6] text-warm-500 font-light">
                          {event.tagline || event.description}
                        </p>

                        <div className="mt-auto space-y-3 border-t border-[var(--card-border)] pt-5 text-[0.85rem] text-warm-500 font-medium">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass/10 border border-brass/25 text-brass">
                              <CalendarDays size={14} />
                            </div>
                            <span className="text-ink/90 font-semibold">
                              {new Intl.DateTimeFormat("en-GB", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }).format(new Date(event.startsAt))}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass/10 border border-brass/25 text-brass">
                              <MapPin size={14} />
                            </div>
                            <span className="truncate text-ink/80">
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

        {/* ===================== EVENT LIFECYCLE (FAITHFUL STEWARDS) ===================== */}
        <section id="lifecycle" className="scroll-mt-24 bg-parchment py-24 sm:py-32 transition-colors">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <SectionHead
              index="01"
              eyebrow="Sanctuary Stewardship · 1 Cor 4:2"
              title={<>One operating system for the entire gathering.</>}
              description={
                <>
                  &ldquo;Moreover it is required in stewards, that a man be found faithful.&rdquo; — 1 Corinthians 4:2. Selah empowers event coordinators, ushers, administrators, and ministers with seamless cohesion.
                </>
              }
            />
            <div className="mt-12 grid gap-px overflow-hidden rounded-[24px] border border-[var(--card-border)] bg-[var(--card-border)] md:grid-cols-5 shadow-lg">
              {[
                ["01", "Plan", "Build from a kingdom blueprint instead of a blank screen.", Compass, "Luke 14:28"],
                ["02", "Promote", "Give your revival or convention a reverent public home.", Sparkles, "Matt 5:14"],
                ["03", "Register", "Passes, seating, dorm allocations, and payments.", Ticket, "Psalm 100:4"],
                ["04", "Run", "Volunteers, prayer teams, and QR gatekeeping in one command hub.", QrCode, "1 Cor 14:40"],
                ["05", "Remember", "Preserve records, follow up with attendees, and duplicate next time.", CheckCircle2, "2 Tim 1:13"],
              ].map(([step, title, body, Icon, verse], i) => (
                <Reveal key={step as string} delay={i * 0.05}>
                  <div className="group motion-lift h-full bg-[var(--card-bg)] p-6 transition-colors duration-300 hover:bg-brass/5 sm:p-7 flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="tnum font-display text-[1.1rem] font-bold text-brass">{step as string}</span>
                      <span className="text-[0.62rem] font-mono text-warm-400 uppercase tracking-widest">{verse as string}</span>
                    </div>
                    <div className="mt-8">
                      <Icon size={22} className="text-brass transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <h3 className="font-display mt-5 text-[1.3rem] font-semibold text-ink">{title as string}</h3>
                    <p className="mt-3 text-[0.825rem] leading-[1.7] text-warm-500 font-light">{body as string}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== ORGANIZATION MEMORY & BLUEPRINTS ===================== */}
        <section className="relative overflow-hidden bg-parchment-deep py-24 text-ink sm:py-32 border-t border-[var(--nav-border)] transition-colors">
          <div className="absolute top-[30%] left-[20%] w-[350px] h-[350px] bg-brass/10 blur-[120px] rounded-full animate-celestial pointer-events-none" />
          <div
            className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full animate-celestial-reverse pointer-events-none"
            style={{ animationDelay: "3s" }}
          />

          <div className="relative z-10 mx-auto grid max-w-[1240px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
            <Reveal>
              <SectionHead
                index="02"
                eyebrow="Kingdom Legacy · 2 Timothy 1:13–14"
                title={<>Your next gathering should never start from zero.</>}
                description={
                  <>
                    &ldquo;Hold fast the form of sound words... that good thing which was committed unto thee keep by the Holy Ghost.&rdquo; Turn a successful conference or camp retreat into a reusable blueprint for future generations.
                  </>
                }
              />
            </Reveal>

            <Reveal delay={0.12} y={28}>
              <div className="rounded-[24px] border border-brass/35 bg-[var(--card-bg)] p-4 shadow-2xl backdrop-blur-md">
                <div className="rounded-[18px] bg-brass/5 p-6 text-ink sm:p-8 border border-[var(--card-border)]">
                  <div className="flex items-center justify-between gap-4 border-b border-[var(--card-border)] pb-5">
                    <div>
                      <span className="eyebrow text-[0.55rem] text-brass uppercase font-bold tracking-widest">
                        Ministry Blueprint
                      </span>
                      <h3 className="font-display mt-2 text-[1.55rem] font-semibold text-ink">
                        Annual Holy Convocation
                      </h3>
                    </div>
                    <span className="pill pill-brass font-bold">Used 6×</span>
                  </div>

                  <div className="mt-6 flex flex-col border border-[var(--card-border)] rounded-[14px] bg-[var(--card-bg)] overflow-hidden">
                    {[
                      { title: "Registration & Ticketing Tiers", status: "ready" },
                      { title: "Guest Speaker Protocols & Bios", status: "ready" },
                      { title: "Volunteer & Ushering Structure", status: "warning" },
                      { title: "Camp Accommodation & Lodging", status: "ready" },
                      { title: "Hospitality & Shuttle Transport", status: "warning" },
                      { title: "Emergency Broadcast Timeline", status: "ready" },
                    ].map((item, idx, arr) => (
                      <div
                        key={item.title}
                        className={`flex items-center gap-4 px-5 py-3.5 ${
                          idx !== arr.length - 1 ? "border-b border-[var(--card-border)]" : ""
                        }`}
                      >
                        {item.status === "ready" ? (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-signal-green/15 text-signal-green">
                            <CheckCircle2 size={15} strokeWidth={2.5} />
                          </div>
                        ) : (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-signal-amber/15 text-signal-amber">
                            <AlertTriangle size={14} strokeWidth={2.5} />
                          </div>
                        )}
                        <span className="text-[0.925rem] font-medium text-ink">{item.title}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-[12px] bg-brass/15 border border-brass/30 px-4 py-3 text-brass">
                    <span className="text-[0.76rem] text-brass-deep dark:text-brass-light font-medium">Next Year Deployment</span>
                    <span className="text-[0.78rem] font-bold text-brass-deep dark:text-brass-light flex items-center gap-1">
                      1-Click Clone <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ===================== DAILY SANCTUARY INVITATION ===================== */}
        <section className="relative overflow-hidden bg-parchment py-24 sm:py-32 border-t border-[var(--nav-border)]">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8 text-center relative z-10">
            <Reveal>
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brass/35 bg-brass/10 px-4 py-1.5 text-xs font-bold text-brass uppercase tracking-widest">
                <Sun size={14} className="text-brass-light" />
                <span>Daily Digital Sanctuary · Psalm 46:10</span>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h2 className="font-display mx-auto max-w-3xl text-3xl sm:text-5xl font-semibold text-ink leading-tight">
                &ldquo;Be still, and know that I am God.&rdquo;
              </h2>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-warm-500 font-light leading-relaxed">
                Connect beyond the event day. Join believers worldwide on Selah&apos;s Daily Sanctuary with morning scripture reflections, sacred lockscreens, and a communal prayer wall.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/sanctuary"
                  className="btn btn-brass !rounded-full !px-9 !py-4 font-bold shadow-lift flex items-center gap-2"
                >
                  <BookOpen size={18} />
                  Enter Daily Sanctuary
                </Link>
                <Link
                  href="/my-tickets"
                  className="btn btn-ghost !rounded-full !px-8 !py-4 border-brass/30 text-ink font-semibold"
                >
                  Retrieve Event Pass
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}