import Image from "next/image";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  Clock,
  Download,
  MapPin,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Users,
  Phone,
  Mail,
  Globe,
  Sparkles,
  Ticket,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/countdown";
import { Reveal } from "@/components/ui";
import {
  getEventBySlug,
  getSessions,
  getSpeakers,
  getTickets,
  getEventProducts,
  getEventAnnouncements,
  getEventShuttles,
  getEventAccommodations,
} from "@/lib/data";
import { EventStore } from "@/components/event-store";
import { PastoralBroadcastBanner } from "@/components/pastoral-broadcast-banner";
import { CampLogisticsPortal } from "@/components/camp-logistics-portal";
import { ShareEventButton } from "@/components/share-event-modal";
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatRange,
  formatTime,
  percent,
} from "@/lib/format";
import { getEventTag, isSeatedEvent, getEventTypeLabel } from "@/lib/event-tags";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };

  return {
    title: `${event.title} · ${event.city}`,
    description:
      event.tagline ||
      event.description?.slice(0, 170) ||
      "Register for this event on Selah.",
    alternates: {
      canonical: `/e/${event.slug}`,
    },
    openGraph: {
      type: "website",
      title: event.title,
      description: event.tagline || event.description?.slice(0, 170) || "Register for this event on Selah.",
      images: event.coverImage
        ? [{ url: event.coverImage, width: 1536, height: 1024 }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: event.tagline ?? undefined,
    },
  };
}

export default async function EventPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const search = searchParams ? await searchParams : {};
  const isEmbed = search?.embed === "true";
  const event = await getEventBySlug(slug);
  if (!event || event.visibility === "private") notFound();

  const [tickets, speakers, sessions, products, announcements, shuttles, accommodations] =
    await Promise.all([
      getTickets(event.id),
      getSpeakers(event.id),
      getSessions(event.id),
      getEventProducts(event.id, true),
      getEventAnnouncements(event.id, true),
      getEventShuttles(event.id),
      getEventAccommodations(event.id),
    ]);

  const totalSold = tickets.reduce((sum, t) => sum + t.sold, 0);
  const fillRate = percent(totalSold, event.capacity);

  const isCancelled = event.status === "cancelled";
  const isPostponed = event.status === "postponed";

  const isRegistrationUpcoming =
    !isCancelled && !isPostponed && event.registrationOpensAt && new Date(event.registrationOpensAt) > new Date();

  const isRegistrationClosed =
    isCancelled ||
    isPostponed ||
    (event.registrationClosesAt && new Date(event.registrationClosesAt) < new Date()) ||
    new Date(event.endsAt) < new Date();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.tagline ?? event.description,
    startDate: new Date(event.startsAt || Date.now()).toISOString(),
    endDate: new Date(event.endsAt || Date.now()).toISOString(),
    eventStatus: isCancelled
      ? "https://schema.org/EventCancelled"
      : isPostponed
      ? "https://schema.org/EventPostponed"
      : "https://schema.org/EventScheduled",
    eventAttendanceMode:
      event.mode === "online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venueName ?? event.city,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.venueAddress ?? undefined,
        addressLocality: event.city,
        addressCountry: event.country,
      },
    },
    image: event.coverImage ? [event.coverImage] : undefined,
    offers: tickets.map((t) => ({
      "@type": "Offer",
      name: t.name,
      price: t.price,
      priceCurrency: t.currency,
      availability: "https://schema.org/InStock",
      url: `/e/${event.slug}/register`,
    })),
  };

  return (
    <div 
      className="min-h-screen bg-parchment" 
      style={event.brandColor ? {
        '--color-brass': event.brandColor,
        '--color-brass-deep': `color-mix(in srgb, ${event.brandColor}, black 20%)`,
        '--color-brass-light': `color-mix(in srgb, ${event.brandColor}, white 30%)`,
        '--color-brass-wash': `color-mix(in srgb, ${event.brandColor}, white 85%)`,
      } as React.CSSProperties : undefined}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Pastoral Broadcast / Flash Announcements */}
      <PastoralBroadcastBanner announcements={announcements} />

      {/* Cancellation / Postponement Notice Banner */}
      {isCancelled && (
        <div className="relative z-20 border-b border-red-500/30 bg-[#3b1212] px-5 py-5 text-white sm:px-8 shadow-md">
          <div className="mx-auto flex max-w-[1180px] items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display text-lg font-semibold text-white">This event has been cancelled</h2>
              <p className="mt-1 text-sm text-red-200 leading-relaxed max-w-3xl">
                {event.cancellationReason || "This program has been cancelled by the organizers. If you have already registered or purchased tickets, please check your email or contact the organizers for refund details."}
              </p>
            </div>
          </div>
        </div>
      )}

      {isPostponed && (
        <div className="relative z-20 border-b border-amber-500/30 bg-[#3b2b10] px-5 py-5 text-white sm:px-8 shadow-md">
          <div className="mx-auto flex max-w-[1180px] items-start gap-4">
            <Clock className="h-6 w-6 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display text-lg font-semibold text-white">This event has been postponed</h2>
              <p className="mt-1 text-sm text-amber-200 leading-relaxed max-w-3xl">
                {event.cancellationReason || "This program has been postponed. The organizers will communicate the rescheduled dates soon. Existing registrations will remain reserved."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------- Hero ------------- */}
      <section className="relative isolate overflow-hidden pt-[76px] pb-16 sm:pb-24">
        {/* Layer 1: Ambient Blurred Aura of the Cover Flyer */}
        <div className="absolute inset-0 -z-30 overflow-hidden pointer-events-none">
          {event.coverImage ? (
            <div className="relative h-full w-full scale-110 filter blur-[90px] opacity-35 dark:opacity-50 transform-gpu">
              <Image
                src={event.coverImage}
                alt=""
                aria-hidden="true"
                fill
                priority
                className="object-cover"
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(226,192,115,0.18)_0%,rgba(9,32,25,0.95)_75%)]" />
          )}
        </div>

        {/* Layer 2: Main Background Artwork with Cinematic Vignette */}
        <div className="absolute inset-0 -z-20">
          {event.coverImage ? (
            <Image
              src={event.coverImage}
              alt={event.title}
              aria-hidden="true"
              className="object-cover object-center brightness-[0.7] contrast-[1.05]"
              style={{
                objectPosition: (event.media as any[])?.[0]?.focus 
                  ? `${(event.media as any[])[0].focus.x}% ${(event.media as any[])[0].focus.y}%` 
                  : "center"
              }}
              priority
              fill
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-cypress text-brass-light flex items-center justify-end opacity-10">
              <CalendarDays size={400} className="-mr-20" />
            </div>
          )}

          {/* Master Cinematic Gradient System:
              - Left dark wash for ultra-sharp typography legibility
              - Bottom smooth fade into parchment page background
              - Top dark header blend */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07130e]/95 via-[#07130e]/82 to-[#07130e]/45 dark:from-[#050706]/98 dark:via-[#050706]/85 dark:to-[#050706]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-parchment)] via-transparent to-[#07130e]/75" />
          <div className="grain pointer-events-none absolute inset-0 opacity-[0.2]" />

          {/* Subtle Ambient Golden Light Halo on the Title zone */}
          <div className="absolute top-[20%] left-[10%] w-[450px] h-[450px] bg-brass/15 blur-[140px] rounded-full pointer-events-none -z-10 animate-sacred-breathe" />
        </div>

        <div className="mx-auto w-full max-w-[1240px] px-5 pt-8 pb-10 sm:px-8 sm:pt-12 sm:pb-16">
          {/* Top Bar: Breadcrumb + Host Ministry */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <nav aria-label="Breadcrumb" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <Link
                href="/"
                className="text-[0.66rem] font-bold text-brass-light hover:text-white transition-colors uppercase tracking-widest"
              >
                Selah
              </Link>
              <span className="text-white/30 text-xs">/</span>
              <span className="text-[0.66rem] font-bold text-white/90 uppercase tracking-widest">
                {getEventTag(event.eventType)}
              </span>
            </nav>

            {event.organization && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-1.5 backdrop-blur-md text-xs text-white/80 shadow-sm">
                <Building2 size={13} className="text-brass-light shrink-0" />
                <span>Hosted by <strong className="text-white font-semibold">{event.organization.name}</strong></span>
                {event.organization.isVerified && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-brass/20 border border-brass/40 px-2 py-0.5 text-[0.68rem] font-bold text-brass-light ml-0.5"
                    title="Verified Ministry • Official Christian organization verified by Selah Platform"
                  >
                    <CheckCircle2 size={11} className="text-brass-light" />
                    Verified
                  </span>
                )}
              </div>
            )}
          </div>

          <Reveal delay={0.08} y={24} className="mt-8">
            <div className="grid gap-10 lg:grid-cols-[1.32fr_1fr] lg:items-end">
              <div>
                {/* Live Status & Social Proof Badges */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {isCancelled ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/50 bg-red-950/80 px-3.5 py-1 text-xs font-bold text-red-200 backdrop-blur-md shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      Event Cancelled
                    </span>
                  ) : isPostponed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-950/80 px-3.5 py-1 text-xs font-bold text-amber-200 backdrop-blur-md shadow-sm">
                      <Clock size={12} className="text-amber-300" />
                      Event Postponed
                    </span>
                  ) : isRegistrationClosed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white/70 backdrop-blur-md">
                      Registration Closed
                    </span>
                  ) : isRegistrationUpcoming ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brass/40 bg-brass/15 px-3.5 py-1 text-xs font-bold text-brass-light backdrop-blur-md">
                      <Sparkles size={12} className="text-brass-light" />
                      Opens {formatDate(event.registrationOpensAt!)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/70 px-3.5 py-1 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-[0_0_18px_rgba(16,185,129,0.25)]">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                      </span>
                      Registration Open
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3.5 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
                    <MapPin size={12} className="text-brass-light shrink-0" />
                    <span>{event.city}, {event.country}</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3.5 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
                    <Users size={12} className="text-brass-light shrink-0" />
                    <span><strong className="text-white font-semibold">{formatNumber(totalSold)}</strong> registered</span>
                  </span>

                  {isSeatedEvent(event.eventType) && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brass/50 bg-brass/15 px-3.5 py-1 text-xs font-semibold text-brass-light backdrop-blur-md shadow-sm">
                      🍽️ Table Seating
                    </span>
                  )}
                </div>

                {/* Event Main Title */}
                <h1 className="font-display mt-6 text-[clamp(2.4rem,6vw,4.5rem)] leading-[1.04] font-bold tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.85)]">
                  {event.title}
                </h1>

                {/* Event Theme Card */}
                {event.theme ? (
                  <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-brass/35 bg-gradient-to-r from-brass/25 via-brass/10 to-transparent px-5 py-2.5 backdrop-blur-md shadow-sm">
                    <Sparkles size={16} className="text-brass-light shrink-0 animate-pulse" />
                    <p className="font-display text-[clamp(1.1rem,2.2vw,1.45rem)] leading-snug font-serif italic text-brass-light tracking-wide">
                      &ldquo;{event.theme}&rdquo;
                    </p>
                  </div>
                ) : null}

                {/* Event Tagline */}
                {event.tagline ? (
                  <p className="mt-6 max-w-[42rem] text-[clamp(1.025rem,1.6vw,1.175rem)] leading-[1.75] text-white/85 font-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                    {event.tagline}
                  </p>
                ) : null}

                {/* Action Suite (CTAs) */}
                <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  {isRegistrationClosed ? (
                    <button
                      disabled
                      className="btn btn-brass opacity-50 cursor-not-allowed !rounded-full !px-8 !py-4.5 !text-[1rem] font-bold"
                    >
                      Registration Closed
                    </button>
                  ) : isRegistrationUpcoming ? (
                    <button
                      disabled
                      className="btn btn-brass opacity-50 cursor-not-allowed !rounded-full !px-8 !py-4.5 !text-[1rem] font-bold"
                    >
                      Opens {formatDate(event.registrationOpensAt!)}
                    </button>
                  ) : (
                    <Link
                      href={`/e/${event.slug}/register`}
                      className="btn btn-brass !rounded-full !px-8 !py-4.5 !text-[1.025rem] font-bold shadow-[0_0_35px_rgba(226,192,115,0.45)] hover:shadow-[0_0_55px_rgba(226,192,115,0.65)] transition-all duration-300 hover:-translate-y-0.5 inline-flex items-center gap-2 group"
                    >
                      <span>Register now</span>
                      <ArrowUpRight size={18} strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  )}

                  <a
                    href="#tickets"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 px-7 py-4 text-[0.95rem] font-semibold text-white backdrop-blur-md shadow-sm transition-all hover:-translate-y-0.5"
                  >
                    <Ticket size={16} className="text-brass-light" />
                    <span>View tickets</span>
                  </a>

                  {sessions.length > 0 && (
                    <a
                      href="#schedule"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 px-6 py-4 text-[0.95rem] font-semibold text-white backdrop-blur-md shadow-sm transition-all hover:-translate-y-0.5"
                    >
                      <CalendarDays size={16} className="text-brass-light" />
                      <span>Schedule</span>
                    </a>
                  )}

                  {products.length > 0 && (
                    <a
                      href="#store"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-brass/35 bg-brass/15 hover:bg-brass/25 px-6 py-4 text-[0.95rem] font-semibold text-brass-light backdrop-blur-md shadow-sm transition-all hover:-translate-y-0.5"
                    >
                      <span>🛍️ Event Store</span>
                      <span className="rounded-full bg-brass/35 px-2 py-0.5 text-xs font-bold text-white">
                        {products.length}
                      </span>
                    </a>
                  )}
                </div>
              </div>

              {/* Right Column: Command Pass Countdown & Live Venue Card */}
              <div className="relative overflow-hidden rounded-[26px] border border-white/20 bg-black/45 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)]">
                {/* Top Card Ambient Gradient Hairline */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brass to-transparent" />

                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brass-light">
                    <Clock size={13} className="text-brass-light" />
                    {/* eslint-disable-next-line react-hooks/purity */}
                    <span>
                      {new Date(event.startsAt).getTime() > Date.now()
                        ? "Countdown to Assembly"
                        : "Assembly Underway"}
                    </span>
                  </div>
                  <span className="inline-flex h-2 w-2 rounded-full bg-brass animate-ping" />
                </div>

                <Countdown target={new Date(event.startsAt).toISOString()} variant="hero-glass" />

                <dl className="mt-7 space-y-0 divide-y divide-white/10 border-y border-white/10">
                  {[
                    {
                      icon: CalendarDays,
                      term: "Dates",
                      value: formatRange(event.startsAt, event.endsAt),
                    },
                    {
                      icon: Clock,
                      term: "Doors open",
                      value: `${formatTime(event.startsAt)} (WAT)`,
                    },
                    {
                      icon: Building2,
                      term: "Venue",
                      value: `${event.venueName ?? "To be confirmed"}${
                        event.venueAddress ? `, ${event.venueAddress}` : ""
                      }`,
                      isMapLink: !!(event.venueAddress || event.venueName),
                      mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${event.venueName ?? ""} ${event.venueAddress ?? ""} ${event.city}`
                      )}`,
                    },
                    {
                      icon: Users,
                      term: "Capacity & Progress",
                      value: `${formatNumber(event.capacity)} total capacity · ${fillRate}% filled`,
                      progress: fillRate,
                    },
                  ].map((row) => (
                    <div
                      key={row.term}
                      className="flex items-start gap-3.5 py-3.5 first:pt-4 last:pb-4"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-brass-light shadow-inner">
                        <row.icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <dt className="eyebrow text-[0.58rem] font-bold text-white/50 uppercase tracking-widest">
                          {row.term}
                        </dt>
                        {row.isMapLink && row.mapUrl ? (
                          <a
                            href={row.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1.5 text-[0.88rem] leading-snug font-medium text-parchment hover:text-brass-light transition-colors group"
                          >
                            <span className="truncate">{row.value}</span>
                            <ArrowUpRight size={13} className="shrink-0 text-brass-light group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </a>
                        ) : (
                          <dd className="mt-0.5 text-[0.88rem] leading-snug font-medium text-parchment">
                            {row.value}
                          </dd>
                        )}
                        {typeof row.progress === "number" && (
                          <div className="mt-2 h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-brass-deep to-brass transition-all duration-1000"
                              style={{ width: `${Math.min(100, Math.max(5, row.progress))}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                      event.title
                    )}&dates=${(new Date(event.startsAt || Date.now()))
                      .toISOString()
                      .replace(/[-:]/g, "")
                      .replace(/\.\d{3}/, "")}/${(new Date(event.endsAt || Date.now()))
                      .toISOString()
                      .replace(/[-:]/g, "")
                      .replace(/\.\d{3}/, "")}&location=${encodeURIComponent(
                      `${event.venueName ?? ""} ${event.venueAddress ?? ""} ${event.city}`
                    )}&details=${encodeURIComponent(event.tagline ?? "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-3 text-xs font-semibold text-white backdrop-blur-md shadow-sm transition-all hover:-translate-y-0.5"
                  >
                    <Download size={14} className="text-brass-light" />
                    <span>Google Calendar</span>
                  </a>
                  <ShareEventButton
                    event={{
                      title: event.title,
                      slug: event.slug,
                      description: event.description,
                      tagline: event.tagline,
                      theme: event.theme,
                      startsAt: event.startsAt,
                      endsAt: event.endsAt,
                      venueName: event.venueName,
                      venueAddress: event.venueAddress,
                      city: event.city,
                      organizationName: event.organization?.name,
                      coverImage: event.coverImage,
                    }}
                    variant="light"
                    size="md"
                    label="Share event"
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------- About + proof ------------- */}
      <section className="page-enter border-b border-[rgba(22,19,17,0.1)] bg-parchment py-18">
        <div className="mx-auto grid w-full max-w-[1180px] gap-12 px-5 sm:px-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="eyebrow text-[0.625rem] text-[var(--color-brass-deep)]">
              About this event
            </div>
            <h2 className="font-display mt-4 text-[clamp(1.85rem,3.4vw,2.55rem)] leading-[1.14] font-semibold text-ink">
              {event.theme
                ? `Gathering around “${event.theme}”`
                : "What to expect"}
            </h2>
            <div className="mt-6 space-y-4 text-[1.025rem] leading-[1.82] text-warm-600">
              <p>{event.description}</p>
              <p>
                Registration is handled in a few short steps and takes about two
                minutes on a phone. You&apos;ll receive a digital ticket with a
                QR code straight away — there&apos;s no account to create.
              </p>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Secure check-in",
                  body: "Your ticket carries a secure code, not your personal details.",
                },
                {
                  icon: Users,
                  title: "Group friendly",
                  body: "Register family or a whole church group in one flow.",
                },
                {
                  icon: CalendarDays,
                  title: "Add to calendar",
                  body: "Google, Apple or .ics — no account needed.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[13px] border border-[rgba(22,19,17,0.1)] bg-paper p-5"
                >
                  <item.icon
                    size={19}
                    strokeWidth={1.7}
                    className="text-[var(--color-brass-deep)]"
                  />
                  <h3 className="mt-3.5 text-[0.925rem] leading-snug font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[0.8125rem] leading-[1.65] text-warm-500">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[320px] w-full overflow-hidden rounded-[16px] border border-[rgba(22,19,17,0.1)] flex flex-col justify-end">
            <Image
              src="/images/welcome-desk.jpg"
              alt="Volunteers preparing the welcome desk before the event"
              className="object-cover"
              fill
              sizes="(max-width: 1024px) 100vw, 500px"
            />
            <div className="relative z-10 bg-paper/95 p-7 backdrop-blur-md border-t border-[rgba(22,19,17,0.1)]">
              <h3 className="font-display text-[1.22rem] leading-tight font-semibold text-ink">
                Registration progress
              </h3>
              <div className="tnum mt-4 flex items-baseline justify-between">
                <span className="text-[1.65rem] leading-none font-semibold text-ink">
                  {formatNumber(totalSold)}
                </span>
                <span className="text-[0.82rem] text-warm-400">
                  of {formatNumber(event.capacity)} places
                </span>
              </div>
              <div className="mt-3 h-[7px] w-full overflow-hidden rounded-full bg-[rgba(22,19,17,0.09)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(3, fillRate)}%`,
                    background:
                      "linear-gradient(90deg, var(--color-brass), var(--color-brass-light))",
                  }}
                />
              </div>
              <p className="mt-4 text-[0.8125rem] leading-[1.68] text-warm-500">
                {event.registrationClosesAt
                  ? `Registration closes ${formatDate(
                      event.registrationClosesAt
                    )}. Places are confirmed in order of registration.`
                  : "Places are confirmed in order of registration."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------- Event Gallery ------------- */}
      {event.media && event.media.length > 0 ? (
        <section className="bg-parchment py-18 border-b border-[rgba(22,19,17,0.1)]">
          <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
            <div className="eyebrow text-[0.625rem] text-[var(--color-brass-deep)]">
              Gallery
            </div>
            <h2 className="font-display mt-4 mb-10 text-[clamp(1.85rem,3.4vw,2.55rem)] leading-[1.12] font-semibold text-ink">
              Experience the moment.
            </h2>
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {event.media.map((item, index) => (
                <div 
                  key={index} 
                  className={`relative overflow-hidden rounded-[16px] bg-paper shadow-sm border border-[rgba(22,19,17,0.1)] ${
                    index === 0 ? "sm:col-span-2 md:col-span-2 aspect-[16/9]" : "aspect-[4/3]"
                  }`}
                >
                  {item.type === "video" ? (
                    <iframe 
                      src={item.url} 
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <Image
                        src={item.url}
                        alt={`Event media ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-700 hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------- Speakers ------------- */}
      {speakers.length > 0 ? (
        <section className="bg-parchment-deep py-18">
          <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="eyebrow text-[0.625rem] text-[var(--color-brass-deep)]">
                  Speakers
                </div>
                <h2 className="font-display mt-4 text-[clamp(1.85rem,3.4vw,2.55rem)] leading-[1.12] font-semibold text-ink">
                  Teaching, worship and conversation.
                </h2>
              </div>
              <p className="max-w-sm text-[0.9125rem] leading-[1.72] text-warm-500">
                Speakers are drawn from the wider church — leaders, teachers and
                practitioners serving across ministry, enterprise and public
                life.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {speakers.map((speaker) => (
                <article
                  key={speaker.id}
                  className="group flex gap-5 rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-paper p-6 transition-shadow duration-300 hover:shadow-[0_28px_56px_-30px_rgba(14,42,34,0.5)]"
                >
                  <div
                    className="font-display flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[1.05rem] font-semibold"
                    style={{
                      background: `linear-gradient(140deg, ${speaker.accentHue}22, ${speaker.accentHue}44)`,
                      color: speaker.accentHue,
                      border: `1px solid ${speaker.accentHue}33`,
                    }}
                    aria-hidden="true"
                  >
                    {speaker.name
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")}
                  </div>
                  <div>
                    <h3 className="text-[1.045rem] leading-snug font-semibold text-ink">
                      {speaker.name}
                    </h3>
                    <p className="mt-1 text-[0.795rem] font-medium text-[var(--color-brass-deep)]">
                      {speaker.role}
                      {speaker.organization
                        ? ` · ${speaker.organization}`
                        : ""}
                    </p>
                    <p className="mt-3 text-[0.845rem] leading-[1.7] text-warm-500">
                      {speaker.bio}
                    </p>
                    {speaker.topic ? (
                      <p className="mt-3.5 border-t border-[rgba(22,19,17,0.09)] pt-3 text-[0.795rem] leading-snug font-medium text-ink">
                        “{speaker.topic}”
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------- Schedule ------------- */}
      {sessions.length > 0 ? (
        <section id="schedule" className="scroll-mt-24 bg-parchment py-18">
          <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
            <div className="eyebrow text-[0.625rem] text-[var(--color-brass-deep)]">
              Schedule
            </div>
            <h2 className="font-display mt-4 max-w-2xl text-[clamp(1.85rem,3.4vw,2.55rem)] leading-[1.12] font-semibold text-ink">
              The shape of the days.
            </h2>

            {[...new Set(sessions.map((s) => s.day))].map((day) => (
              <div key={day} className="mt-11">
                <div className="flex items-baseline gap-4">
                  <h3 className="font-display text-[1.32rem] font-semibold text-ink">
                    Day {day}
                  </h3>
                  <span className="h-px flex-1 bg-[rgba(22,19,17,0.13)]" />
                  <span className="text-[0.8125rem] text-warm-400">
                    {formatDate(sessions.find((s) => s.day === day)!.startsAt, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    } as Intl.DateTimeFormatOptions)}
                  </span>
                </div>

                <ol className="mt-2">
                  {sessions
                    .filter((s) => s.day === day)
                    .map((session) => (
                      <li
                        key={session.id}
                        className="grid gap-4 border-t border-[rgba(22,19,17,0.11)] py-6 sm:grid-cols-[7.5rem_1fr_auto] sm:items-start"
                      >
                        <div className="tnum text-[0.905rem] font-semibold text-[var(--color-brass-deep)]">
                          {formatTime(session.startsAt)}
                          <span className="block text-warm-400">
                            {formatTime(session.endsAt)}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-[1.045rem] leading-snug font-semibold text-ink">
                            {session.title}
                          </h4>
                          {session.speakerName ? (
                            <p className="mt-1.5 text-[0.845rem] text-warm-500">
                              {session.speakerName}
                            </p>
                          ) : null}
                          {session.description ? (
                            <p className="mt-2 max-w-[42rem] text-[0.845rem] leading-[1.72] text-warm-500">
                              {session.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="pill pill-neutral">{session.track}</span>
                          <span className="pill pill-brass">
                            <MapPin size={11} /> {session.venue}
                          </span>
                        </div>
                      </li>
                    ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ------------- Tickets ------------- */}
      <section
        id="tickets"
        className="scroll-mt-24 bg-parchment-deep py-18"
      >
        <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="eyebrow text-[0.625rem] text-[var(--color-brass-deep)]">
                Tickets
              </div>
              <h2 className="font-display mt-4 text-[clamp(1.85rem,3.4vw,2.55rem)] leading-[1.12] font-semibold text-ink">
                Choose what fits.
              </h2>
            </div>
            {isCancelled ? (
              <button
                disabled
                className="btn bg-red-950/40 border border-red-500/30 text-red-200 opacity-80 cursor-not-allowed !px-7 !py-4"
              >
                Event Cancelled
              </button>
            ) : isPostponed ? (
              <button
                disabled
                className="btn bg-amber-950/40 border border-amber-500/30 text-amber-200 opacity-80 cursor-not-allowed !px-7 !py-4"
              >
                Event Postponed
              </button>
            ) : isRegistrationClosed ? (
              <button
                disabled
                className="btn btn-primary opacity-50 cursor-not-allowed !px-7 !py-4"
              >
                Registration closed
              </button>
            ) : isRegistrationUpcoming ? (
              <button
                disabled
                className="btn btn-primary opacity-50 cursor-not-allowed !px-7 !py-4"
              >
                Opens {formatDate(event.registrationOpensAt!)}
              </button>
            ) : (
              <Link
                href={`/e/${event.slug}/register`}
                className="btn btn-primary !px-7 !py-4"
              >
                Start registration
                <ArrowUpRight size={17} strokeWidth={2.1} />
              </Link>
            )}
          </div>

          <div className="mt-11 grid gap-6 lg:grid-cols-2">
            {tickets.map((ticket) => {
              const remaining = Math.max(0, ticket.capacity - ticket.sold);
              return (
                <article
                  key={ticket.id}
                  className="relative flex flex-col rounded-[16px] border border-[rgba(22,19,17,0.11)] bg-paper p-8"
                >
                  {ticket.badge ? (
                    <span className="pill pill-brass absolute top-6 right-6">
                      {ticket.badge}
                    </span>
                  ) : null}

                  <h3 className="font-display text-[1.42rem] leading-tight font-semibold text-ink">
                    {ticket.name}
                  </h3>
                  <p className="mt-3 max-w-[26rem] text-[0.905rem] leading-[1.72] text-warm-600">
                    {ticket.description}
                  </p>

                  <div className="mt-7 flex items-baseline gap-2">
                    <span className="font-display tnum text-[2.35rem] leading-none font-semibold text-ink">
                      {Number(ticket.price) === 0 ? "Free" : formatMoney(ticket.price, ticket.currency)}
                    </span>
                    {Number(ticket.price) !== 0 && (
                      <span className="text-[0.8125rem] text-warm-400">
                        per person
                      </span>
                    )}
                  </div>

                  {ticket.benefits?.length ? (
                    <ul className="mt-6 space-y-2.5">
                      {ticket.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="flex items-start gap-2.5 text-[0.875rem] leading-relaxed text-warm-600"
                        >
                          <Check
                            size={15}
                            className="mt-1 shrink-0 text-[var(--color-brass-deep)]"
                          />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-auto pt-8">
                    {ticket.capacity > 0 ? (
                      <>
                        <div className="flex items-center justify-between text-[0.785rem] text-warm-500">
                          <span>
                            {remaining > 0
                              ? `${formatNumber(remaining)} places remaining`
                              : "Currently at capacity"}
                          </span>
                          <span className="tnum">
                            {percent(ticket.sold, ticket.capacity)}% taken
                          </span>
                        </div>
                        <div className="mt-2.5 h-[5px] w-full overflow-hidden rounded-full bg-[rgba(22,19,17,0.09)]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(
                                2,
                                percent(ticket.sold, ticket.capacity)
                              )}%`,
                              background:
                                "linear-gradient(90deg, var(--color-brass), var(--color-brass-light))",
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between text-[0.785rem] text-warm-500">
                        <span>Unlimited places available</span>
                        <span className="tnum">
                          {formatNumber(ticket.sold)} taken
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-6">
                      {isRegistrationClosed ? (
                        <button disabled className="btn w-full bg-[rgba(22,19,17,0.05)] text-warm-500 opacity-50 cursor-not-allowed">
                          Registration closed
                        </button>
                      ) : isRegistrationUpcoming ? (
                        <button disabled className="btn w-full bg-[rgba(22,19,17,0.05)] text-warm-500 opacity-50 cursor-not-allowed">
                          Opens soon
                        </button>
                      ) : remaining === 0 && ticket.capacity > 0 ? (
                        <button disabled className="btn w-full bg-[rgba(22,19,17,0.05)] text-warm-500 opacity-50 cursor-not-allowed">
                          Sold out
                        </button>
                      ) : (
                        <Link 
                          href={`/e/${event.slug}/register?ticket=${ticket.id}`} 
                          className="btn w-full bg-[rgba(22,19,17,0.05)] text-ink hover:bg-[rgba(22,19,17,0.08)]"
                        >
                          Select this ticket
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Retrieve Pass Quick Link */}
          <div className="mt-8 text-center">
            <p className="text-xs text-warm-500">
              Already registered or bought a ticket?{" "}
              <Link
                href={`/my-tickets?event=${event.slug}`}
                className="font-semibold text-[var(--color-brass-deep)] hover:underline inline-flex items-center gap-1"
              >
                Find &amp; retrieve your lost pass &rarr;
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ------------- Organizer ------------- */}
      {event.organization && (
        <section className="bg-parchment py-18">
          <div className="mx-auto w-full max-w-[700px] px-5 sm:px-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[rgba(22,19,17,0.1)] bg-paper shadow-sm">
              {event.organization.logoUrl ? (
                <Image
                  src={event.organization.logoUrl}
                  alt={event.organization.name}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 size={32} className="text-[var(--color-brass-deep)] opacity-50" />
              )}
            </div>
            <h2 className="font-display mt-5 text-[1.65rem] font-semibold text-ink">
              Hosted by {event.organization.name}
            </h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {event.organization.website && (
                <a
                  href={event.organization.website.startsWith('http') ? event.organization.website : `https://${event.organization.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-light !px-6 !py-3 !text-[0.9rem]"
                >
                  <Globe size={16} />
                  Visit Website
                </a>
              )}
              {event.organization.email && (
                <a
                  href={`mailto:${event.organization.email}`}
                  className="btn btn-light !px-6 !py-3 !text-[0.9rem]"
                >
                  <Mail size={16} />
                  Email
                </a>
              )}
              {event.organization.phone && (
                <a
                  href={`tel:${event.organization.phone.replace(/[^0-9+]/g, '')}`}
                  className="btn btn-light !px-6 !py-3 !text-[0.9rem]"
                >
                  <Phone size={16} />
                  Call
                </a>
              )}
            </div>
          </div>
        </section>
      )}


      {/* ------------- Camp Logistics, Accommodations & Bus Shuttles ------------- */}
      <CampLogisticsPortal
        eventId={event.id}
        eventTitle={event.title}
        shuttles={shuttles}
        accommodations={accommodations}
      />

      {/* ------------- Event Store & Resources ------------- */}
      {products.length > 0 && (
        <EventStore
          eventId={event.id}
          eventSlug={event.slug}
          eventTitle={event.title}
          currency={event.currency}
          products={products}
        />
      )}

      {/* ------------- Final CTA ------------- */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {event.coverImage ? (
            <Image
              src={event.coverImage}
              alt=""
              aria-hidden="true"
              className="object-cover"
              fill
            />
          ) : (
            <div className="absolute inset-0 bg-cypress text-brass-light flex items-center justify-end opacity-10">
              <CalendarDays size={400} className="-mr-20" />
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(96deg, rgba(9,32,25,0.95) 0%, rgba(9,32,25,0.82) 50%, rgba(9,32,25,0.58) 100%)",
            }}
          />
        </div>

        <div className="mx-auto w-full max-w-[1180px] px-5 py-20 text-center sm:px-8 sm:py-24">
          <h2 className="font-display mx-auto max-w-[34rem] text-[clamp(1.95rem,4.2vw,2.95rem)] leading-[1.1] font-semibold text-parchment">
            Ready to be part of {event.title}?
          </h2>
          <p className="mx-auto mt-5 max-w-[32rem] text-[1.045rem] leading-[1.72] text-[rgba(247,243,236,0.8)]">
            Registration takes about two minutes. You&apos;ll get your digital
            ticket immediately — no account, no app to download.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            {isRegistrationClosed ? (
              <button
                disabled
                className="btn btn-brass opacity-50 cursor-not-allowed !px-8 !py-4 !text-[0.98rem]"
              >
                Registration closed
              </button>
            ) : isRegistrationUpcoming ? (
              <button
                disabled
                className="btn btn-brass opacity-50 cursor-not-allowed !px-8 !py-4 !text-[0.98rem]"
              >
                Opens {formatDate(event.registrationOpensAt!)}
              </button>
            ) : (
              <Link
                href={`/e/${event.slug}/register`}
                className="btn btn-brass !px-8 !py-4 !text-[0.98rem]"
              >
                Register for this event
                <ArrowUpRight size={18} strokeWidth={2.1} />
              </Link>
            )}
            <Link href="/" className="btn btn-light !px-8 !py-4 !text-[0.98rem]">
              Back to Selah
            </Link>
          </div>
        </div>
      </section>

      {!isRegistrationClosed && !isRegistrationUpcoming ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-paper/95 px-4 py-3 shadow-[0_-16px_40px_-28px_rgba(14,42,34,0.55)] backdrop-blur-xl sm:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.78rem] font-semibold text-ink">{event.title}</div>
              <div className="mt-0.5 text-[0.68rem] text-warm-500">{formatDate(event.startsAt)} · {event.city}</div>
            </div>
            <ShareEventButton
              event={{
                title: event.title,
                slug: event.slug,
                description: event.description,
                tagline: event.tagline,
                theme: event.theme,
                startsAt: event.startsAt,
                endsAt: event.endsAt,
                venueName: event.venueName,
                venueAddress: event.venueAddress,
                city: event.city,
                organizationName: event.organization?.name,
                coverImage: event.coverImage,
              }}
              variant="light"
              size="sm"
              className="!px-3 !py-3 shrink-0"
              showIcon={true}
              label=""
            />
            <Link href={`/e/${event.slug}/register`} className="btn btn-brass !px-5 !py-3 !text-[0.78rem]">
              Register <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      ) : null}

      <footer className="bg-cypress-deep py-10 pb-24 sm:pb-10">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center justify-between gap-5 px-5 text-center sm:flex-row sm:px-8 sm:text-left">
          <p className="text-[0.8125rem] text-[rgba(247,243,236,0.62)]">
            {event.title} · {formatRange(event.startsAt, event.endsAt)} ·{" "}
            {event.city}
          </p>
          <Link
            href="/"
            className="eyebrow text-[0.585rem] text-brass-light transition-opacity hover:opacity-80"
          >
            Powered by Selah — Christian Event Operating System
          </Link>
        </div>
      </footer>
    </div>
  );
}