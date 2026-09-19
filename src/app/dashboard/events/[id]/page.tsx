import Image from "next/image";
import {
  ArrowLeft,
  ArrowUpRight,
  BedDouble,
  Bus,
  CalendarDays,
  CheckCircle2,
  Download,
  FileStack,
  Mail,
  MapPin,
  Pencil,
  QrCode,
  Share2,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProgressBar, SectionHead } from "@/components/ui";
import {
  getEventById,
  getEventStats,
  getRegistrations,
  getSessions,
  getTickets,
  getVolunteers,
} from "@/lib/data";
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatRange,
  formatTime,
  percent,
  titleCase,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EventManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const [stats, registrations, sessions, volunteers, tickets] =
    await Promise.all([
      getEventStats(event.id),
      getRegistrations(event.id, 8),
      getSessions(event.id),
      getVolunteers(event.id),
      getTickets(event.id),
    ]);

  return (
    <div className="space-y-11">
      {/* Header */}
      <section>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[0.8125rem] font-semibold text-warm-500 transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} /> Back to dashboard
        </Link>

        <div className="mt-6 overflow-hidden rounded-[17px] border border-[rgba(22,19,17,0.1)] bg-cypress text-parchment">
          <div className="relative">
            <Image
              src={event.coverImage ?? "/images/event-stage.jpg"}
              alt=""
              aria-hidden="true"
              className="opacity-45 object-cover"
              fill
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(96deg, rgba(9,32,25,0.94) 0%, rgba(9,32,25,0.78) 52%, rgba(9,32,25,0.5) 100%)",
              }}
            />

            <div className="relative px-8 py-10 sm:px-10">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={
                    event.status === "published"
                      ? "pill border-[rgba(232,211,166,0.28)] bg-[rgba(232,211,166,0.14)] text-brass-light"
                      : "pill border-[rgba(247,243,236,0.22)] bg-[rgba(247,243,236,0.1)] text-parchment"
                  }
                >
                  {titleCase(event.status)}
                </span>
                <span className="pill border-[rgba(247,243,236,0.2)] bg-[rgba(247,243,236,0.09)] text-[rgba(247,243,236,0.82)]">
                  <MapPin size={12} /> {event.city}, {event.country}
                </span>
                <span className="pill border-[rgba(247,243,236,0.2)] bg-[rgba(247,243,236,0.09)] text-[rgba(247,243,236,0.82)]">
                  <CalendarDays size={12} />{" "}
                  {formatRange(event.startsAt, event.endsAt)}
                </span>
              </div>

              <h1 className="font-display mt-6 max-w-[42rem] text-[clamp(2rem,4.2vw,2.95rem)] leading-[1.06] font-semibold tracking-[-0.021em]">
                {event.title}
              </h1>
              {event.theme ? (
                <p
                  className="mt-3.5 text-[1.075rem]"
                  style={{
                    fontStyle: "italic",
                    color: "rgba(232,211,166,0.92)",
                  }}
                >
                  “{event.theme}”
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/events/${event.id}/command`}
                  className="btn btn-brass"
                >
                  <QrCode size={17} /> Open Command Center
                </Link>
                <Link href={`/e/${event.slug}`} className="btn btn-light">
                  <ArrowUpRight size={16} /> View public page
                </Link>
                <Link
                  href={`/e/${event.slug}/register`}
                  className="btn btn-light"
                >
                  <Share2 size={16} /> Test registration
                </Link>
                <button type="button" className="btn btn-light">
                  <Pencil size={16} /> Edit event
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <section className="grid gap-px overflow-hidden rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-[rgba(22,19,17,0.1)] sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: "Registered",
            value: formatNumber(stats.registered),
            detail: `${percent(stats.registered, event.capacity)}% of capacity`,
          },
          {
            label: "Checked in",
            value: formatNumber(stats.checkedIn),
            detail: `${percent(stats.checkedIn, Math.max(1, stats.registered))}% of registered`,
          },
          {
            label: "Collected",
            value: formatMoney(stats.revenue, event.currency),
            detail: `${stats.pendingPayments} payments pending`,
          },
          {
            label: "Volunteers",
            value: formatNumber(stats.volunteerCount),
            detail: `${stats.confirmedVolunteers} confirmed`,
          },
          {
            label: "Sessions",
            value: formatNumber(stats.sessionCount),
            detail: `${new Set(sessions.map((s) => s.track)).size} parallel tracks`,
          },
        ].map((item) => (
          <div key={item.label} className="bg-paper p-7">
            <div className="eyebrow text-[0.575rem] text-warm-400">
              {item.label}
            </div>
            <div className="tnum font-display mt-3.5 text-[2.15rem] leading-none font-semibold text-ink">
              {item.value}
            </div>
            <div className="mt-2.5 text-[0.795rem] text-warm-500">
              {item.detail}
            </div>
          </div>
        ))}
      </section>

      {/* Readiness */}
      <section>
        <SectionHead
          eyebrow="Event readiness"
          title="A factual checklist, not a guess."
          description="Each line reflects the current configuration of this event."
        />

        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-paper p-8">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-[1.32rem] font-semibold text-ink">
                Overall configuration
              </h3>
              <span className="tnum font-display text-[2.15rem] leading-none font-semibold text-[var(--color-brass-deep)]">
                {event.readiness}%
              </span>
            </div>
            <div className="mt-5">
              <ProgressBar value={event.readiness} tone="green" />
            </div>

            <ul className="mt-8 space-y-0">
              {[
                ["Registration window", "Open until 15 Mar 2027", true],
                ["Ticket types", `${tickets.length} configured`, true],
                [
                  "Payment gateway",
                  "Paystack · test mode (no live charges)",
                  true,
                ],
                [
                  "Volunteer coverage",
                  `${stats.confirmedVolunteers}/${stats.volunteerCount} confirmed`,
                  stats.volunteerCount - stats.confirmedVolunteers === 0,
                ],
                [
                  "Accommodation",
                  `${stats.accommodation} delegates requiring rooms`,
                  true,
                ],
                ["Transport", "2 buses still unassigned", false],
                ["Communication timeline", "4 scheduled · 1 draft", true],
                ["Certificates", "Attendance threshold 80%", true],
              ].map(([label, value, ok]) => (
                <li
                  key={String(label)}
                  className="flex items-center gap-4 border-t border-[rgba(22,19,17,0.09)] py-4"
                >
                  {ok ? (
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-[var(--color-signal-green)]"
                    />
                  ) : (
                    <TriangleAlert
                      size={18}
                      className="shrink-0 text-[var(--color-signal-amber)]"
                    />
                  )}
                  <span className="flex-1 text-[0.905rem] font-medium text-ink">
                    {String(label)}
                  </span>
                  <span className="text-right text-[0.8125rem] text-warm-500">
                    {String(value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Operations */}
          <div className="space-y-5">
            <div className="rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-paper p-8">
              <h3 className="font-display text-[1.32rem] font-semibold text-ink">
                Operations at a glance
              </h3>

              <div className="mt-7 space-y-6">
                {[
                  {
                    icon: BedDouble,
                    label: "Accommodation",
                    value: "63 of 80 rooms allocated",
                    detail: "17 rooms available · 4 accessible rooms held",
                    progress: 79,
                  },
                  {
                    icon: Bus,
                    label: "Transportation",
                    value: "4 of 6 routes confirmed",
                    detail: "Lagos Island · Ikeja · Lekki · Ajah · Airport",
                    progress: 67,
                  },
                  {
                    icon: Users,
                    label: "Volunteer departments",
                    value: `${new Set(volunteers.map((v) => v.department)).size} departments active`,
                    detail:
                      "Ushering, Protocol, Media, Welfare, Security, Medical, Transport, Prayer",
                    progress: percent(
                      stats.confirmedVolunteers,
                      Math.max(1, stats.volunteerCount)
                    ),
                  },
                  {
                    icon: Mail,
                    label: "Communications",
                    value: "4 scheduled · 2 sent",
                    detail: "Next: T-14 preparation reminder · 4 Mar 2027",
                    progress: 62,
                  },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-start gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(192,138,46,0.13)]">
                        <row.icon
                          size={18}
                          className="text-[var(--color-brass-deep)]"
                        />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="text-[0.905rem] font-semibold text-ink">
                            {row.label}
                          </span>
                          <span className="tnum text-[0.805rem] text-warm-500">
                            {row.value}
                          </span>
                        </div>
                        <div className="mt-2.5">
                          <ProgressBar value={row.progress} />
                        </div>
                        <div className="mt-2 text-[0.775rem] text-warm-400">
                          {row.detail}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[15px] border border-[rgba(192,138,46,0.3)] bg-[rgba(192,138,46,0.09)] p-7">
              <div className="flex items-start gap-4">
                <ShieldCheck
                  size={21}
                  className="mt-0.5 shrink-0 text-[var(--color-brass-deep)]"
                />
                <div>
                  <h3 className="text-[1.015rem] leading-snug font-semibold text-ink">
                    Save this event as a blueprint
                  </h3>
                  <p className="mt-2.5 text-[0.875rem] leading-[1.72] text-warm-600">
                    Capture the registration form, ticket structure, schedule
                    shape, volunteer departments, communication timeline and
                    certificate rules — then start next year&apos;s event from
                    this instead of from scratch.
                  </p>
                  <Link
                    href="/dashboard/blueprints"
                    className="btn btn-primary mt-5 !py-3 !text-[0.845rem]"
                  >
                    <FileStack size={16} /> Save as blueprint
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registrations */}
      <section>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <SectionHead
            eyebrow="Registrations"
            title="Latest registrations."
            description="Sensitive fields such as emergency contacts and dietary notes are hidden here and only visible to authorised roles."
          />
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-ghost">
              <Download size={16} /> Export CSV
            </button>
            <Link
              href={`/e/${event.slug}/register`}
              className="btn btn-primary"
            >
              Add registration
            </Link>
          </div>
        </div>

        <div className="mt-9 overflow-hidden rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-paper">
          <div className="overflow-x-auto">
            <table className="ledger">
              <thead>
                <tr>
                  <th scope="col">Code</th>
                  <th scope="col">Attendee</th>
                  <th scope="col">Location</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Hospitality</th>
                  <th scope="col">Status</th>
                  <th scope="col">Registered</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id}>
                    <td className="tnum whitespace-nowrap font-semibold text-[var(--color-brass-deep)]">
                      {reg.code}
                    </td>
                    <td>
                      <div className="font-semibold text-ink">
                        {reg.firstName} {reg.lastName}
                      </div>
                      <div className="text-[0.795rem] text-warm-400">
                        {reg.email}
                      </div>
                    </td>
                    <td className="text-warm-500">
                      {reg.city || "—"}
                      {reg.country ? `, ${reg.country}` : ""}
                    </td>
                    <td className="tnum text-ink">
                      {formatMoney(reg.amount, event.currency)}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {reg.accommodation ? (
                          <span className="pill pill-brass !text-[0.625rem]">
                            Accommodation
                          </span>
                        ) : null}
                        {reg.transport ? (
                          <span className="pill pill-neutral !text-[0.625rem]">
                            Transport
                          </span>
                        ) : null}
                        {!reg.accommodation && !reg.transport ? (
                          <span className="text-[0.795rem] text-warm-300">
                            None
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span
                        className={
                          reg.status === "confirmed"
                            ? "pill pill-live"
                            : reg.status === "pending"
                              ? "pill pill-warn"
                              : "pill pill-neutral"
                        }
                      >
                        {titleCase(reg.status)}
                      </span>
                    </td>
                    <td className="tnum whitespace-nowrap text-warm-400">
                      {formatDate(reg.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-[rgba(22,19,17,0.1)] px-6 py-4">
            <p className="text-[0.8125rem] text-warm-500">
              Showing {registrations.length} of{" "}
              {formatNumber(stats.registered)} registrations
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost !px-4 !py-2 !text-[0.8125rem]" disabled>
                Previous
              </button>
              <button type="button" className="btn btn-ghost !px-4 !py-2 !text-[0.8125rem]">
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section>
        <SectionHead
          eyebrow="Schedule"
          title="Sessions and tracks."
          description={`${sessions.length} sessions across ${new Set(sessions.map((s) => s.track)).size} tracks.`}
        />

        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          {[...new Set(sessions.map((s) => s.track))].map((track) => (
            <div
              key={track}
              className="rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-paper"
            >
              <div className="flex items-center justify-between gap-4 border-b border-[rgba(22,19,17,0.1)] px-7 py-5">
                <h3 className="font-display text-[1.185rem] font-semibold text-ink">
                  {track}
                </h3>
                <span className="pill pill-neutral">
                  {sessions.filter((s) => s.track === track).length} sessions
                </span>
              </div>
              <ul>
                {sessions
                  .filter((s) => s.track === track)
                  .slice(0, 5)
                  .map((session) => (
                    <li
                      key={session.id}
                      className="flex items-start gap-5 border-t border-[rgba(22,19,17,0.08)] px-7 py-4 first:border-t-0"
                    >
                      <div className="tnum w-[4.5rem] shrink-0 text-[0.805rem] font-semibold text-[var(--color-brass-deep)]">
                        {formatTime(session.startsAt)}
                        <span className="block text-warm-400">
                          {formatTime(session.endsAt)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-[0.905rem] leading-snug font-semibold text-ink">
                          {session.title}
                        </div>
                        <div className="mt-1 text-[0.795rem] text-warm-400">
                          {session.speakerName
                            ? `${session.speakerName} · `
                            : ""}
                          {session.venue} · Day {session.day}
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
