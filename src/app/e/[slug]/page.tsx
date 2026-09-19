import Image from "next/image";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  Clock,
  Download,
  MapPin,
  Share2,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/countdown";
import {
  getEventBySlug,
  getSessions,
  getSpeakers,
  getTickets,
} from "@/lib/data";
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatRange,
  formatTime,
  percent,
} from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };

  return {
    title: `${event.title} · ${event.city}`,
    description:
      event.tagline ??
      event.description.slice(0, 170) ??
      "Register for this event on Selah.",
    alternates: {
      canonical: `/e/${event.slug}`,
    },
    openGraph: {
      type: "website",
      title: event.title,
      description: event.tagline ?? event.description.slice(0, 170),
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

export default async function EventPage({ params }: Params) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || event.visibility === "private") notFound();

  const [tickets, speakers, sessions] = await Promise.all([
    getTickets(event.id),
    getSpeakers(event.id),
    getSessions(event.id),
  ]);

  const totalSold = tickets.reduce((sum, t) => sum + t.sold, 0);
  const fillRate = percent(totalSold, event.capacity);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.tagline ?? event.description,
    startDate: event.startsAt.toISOString(),
    endDate: event.endsAt.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
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

      {/* ------------- Hero ------------- */}
      <section className="relative isolate overflow-hidden pt-[72px]">
        <div className="absolute inset-0 -z-10">
          <Image
            src={event.coverImage ?? "/images/event-stage.jpg"}
            alt=""
            aria-hidden="true"
            className="object-cover"
            priority
            fill
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(178deg, rgba(9,32,25,0.9) 0%, rgba(9,32,25,0.82) 40%, rgba(9,32,25,0.94) 100%)",
            }}
          />
        </div>

        <div className="mx-auto w-full max-w-[1180px] px-5 pt-12 pb-16 sm:px-8 sm:pt-16 sm:pb-20">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2">
            <Link
              href="/"
              className="eyebrow text-[0.58rem] text-[rgba(232,211,166,0.75)] transition-colors hover:text-brass-light"
            >
              Selah
            </Link>
            <span className="text-[rgba(232,211,166,0.45)]">/</span>
            <span className="eyebrow text-[0.58rem] text-[rgba(232,211,166,0.75)]">
              {event.eventType}
            </span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="pill border-[rgba(232,211,166,0.28)] bg-[rgba(232,211,166,0.12)] text-brass-light">
                  Registration open
                </span>
                <span className="pill border-[rgba(247,243,236,0.18)] bg-[rgba(247,243,236,0.08)] text-[rgba(247,243,236,0.8)]">
                  <MapPin size={12} /> {event.city}, {event.country}
                </span>
                <span className="pill border-[rgba(247,243,236,0.18)] bg-[rgba(247,243,236,0.08)] text-[rgba(247,243,236,0.8)]">
                  <Users size={12} /> {formatNumber(totalSold)} registered
                </span>
              </div>

              <h1 className="font-display mt-6 text-[clamp(2.35rem,5.6vw,4.25rem)] leading-[1.02] font-semibold tracking-[-0.026em] text-parchment">
                {event.title}
              </h1>

              {event.theme ? (
                <p
                  className="mt-5 text-[clamp(1.15rem,2.4vw,1.65rem)] leading-[1.42]"
                  style={{
                    fontStyle: "italic",
                    color: "var(--color-brass-light)",
                  }}
                >
                  “{event.theme}”
                </p>
              ) : null}

              <p className="mt-6 max-w-[42rem] text-[clamp(1rem,1.55vw,1.125rem)] leading-[1.75] text-[rgba(247,243,236,0.82)]">
                {event.tagline}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={`/e/${event.slug}/register`}
                  className="btn btn-brass !px-7 !py-4 !text-[0.95rem]"
                >
                  Register now
                  <ArrowUpRight size={17} strokeWidth={2.1} />
                </Link>
                <a
                  href="#tickets"
                  className="btn btn-light !px-7 !py-4 !text-[0.95rem]"
                >
                  View tickets
                </a>
                <a
                  href="#schedule"
                  className="btn btn-light !px-7 !py-4 !text-[0.95rem]"
                >
                  See the schedule
                </a>
              </div>
            </div>

            {/* Countdown + key facts */}
            <div className="rounded-[18px] border border-[rgba(247,243,236,0.16)] bg-[rgba(247,243,236,0.08)] p-6 backdrop-blur-xl sm:p-7">
              <div className="eyebrow text-[0.585rem] text-brass-light">
                {/* eslint-disable-next-line react-hooks/purity */}
                {new Date(event.startsAt).getTime() > Date.now()
                  ? "Counting down to"
                  : "This event"}
              </div>
              <Countdown target={event.startsAt.toISOString()} />

              <dl className="mt-7 space-y-0">
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
                  },
                  {
                    icon: Users,
                    term: "Capacity",
                    value: `${formatNumber(event.capacity)} · ${fillRate}% filled`,
                  },
                ].map((row) => (
                  <div
                    key={row.term}
                    className="flex items-start gap-3.5 border-t border-[rgba(247,243,236,0.14)] py-4 first:border-t-0 first:pt-0"
                  >
                    <row.icon
                      size={17}
                      className="mt-0.5 shrink-0 text-brass-light"
                    />
                    <div>
                      <dt className="eyebrow text-[0.545rem] text-[rgba(247,243,236,0.6)]">
                        {row.term}
                      </dt>
                      <dd className="mt-1 text-[0.9125rem] leading-snug font-medium text-parchment">
                        {row.value}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <a
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                    event.title
                  )}&dates=${event.startsAt
                    .toISOString()
                    .replace(/[-:]/g, "")
                    .replace(/\.\d{3}/, "")}/${event.endsAt
                    .toISOString()
                    .replace(/[-:]/g, "")
                    .replace(/\.\d{3}/, "")}&location=${encodeURIComponent(
                    `${event.venueName ?? ""} ${event.venueAddress ?? ""} ${event.city}`
                  )}&details=${encodeURIComponent(event.tagline ?? "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-light !px-4 !py-2.5 !text-[0.78rem]"
                >
                  <Download size={14} /> Google Calendar
                </a>
                <a
                  href={`/e/${event.slug}/register`}
                  className="btn btn-light !px-4 !py-2.5 !text-[0.78rem]"
                >
                  <Share2 size={14} /> Share event
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------- About + proof ------------- */}
      <section className="border-b border-[rgba(22,19,17,0.1)] bg-parchment py-18">
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

          <div className="relative h-[300px] w-full overflow-hidden rounded-[16px] border border-[rgba(22,19,17,0.1)]">
            <Image
              src="/images/welcome-desk.jpg"
              alt="Volunteers preparing the welcome desk before the event"
              className="object-cover"
              fill
            />
            <div className="bg-paper p-7">
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
                    <video 
                      src={item.url} 
                      controls 
                      className="h-full w-full object-cover"
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={`Event media ${index + 1}`}
                      className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
                    />
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
            <Link
              href={`/e/${event.slug}/register`}
              className="btn btn-primary !px-7 !py-4"
            >
              Start registration
              <ArrowUpRight size={17} strokeWidth={2.1} />
            </Link>
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
                      {formatMoney(ticket.price, ticket.currency)}
                    </span>
                    <span className="text-[0.8125rem] text-warm-400">
                      per person
                    </span>
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
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------- Final CTA ------------- */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/event-stage.jpg"
            alt=""
            aria-hidden="true"
            className="object-cover"
            fill
          />
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
            <Link
              href={`/e/${event.slug}/register`}
              className="btn btn-brass !px-8 !py-4 !text-[0.98rem]"
            >
              Register for this event
              <ArrowUpRight size={18} strokeWidth={2.1} />
            </Link>
            <Link href="/" className="btn btn-light !px-8 !py-4 !text-[0.98rem]">
              Back to Selah
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-cypress-deep py-10">
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
