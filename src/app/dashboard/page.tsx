import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  FileStack,
  Plus,
  QrCode,
  Radio,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { ProgressBar, Reveal, SectionHead, StatBlock } from "@/components/ui";
import {
  getAuditLogs,
  getBlueprints,
  getEventStats,
  getEventTicketDistribution,
  getEventsForOrganization,
  getOrganization,
  getTasks,
} from "@/lib/data";
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatRange,
  percent,
  relativeDays,
  titleCase,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const org = await getOrganization();
  if (!org) return null;

  const [events, tasks, blueprints, audit] = await Promise.all([
    getEventsForOrganization(org.id),
    getTasks(org.id),
    getBlueprints(org.id),
    getAuditLogs(org.id),
  ]);

  const featured = events.filter((e) => e.status !== "completed").slice(0, 3);
  const stats = await Promise.all(
    featured.map((e) => getEventStats(e.id).then((s) => ({ event: e, s })))
  );
  
  const ticketDist = featured.length > 0 
    ? await getEventTicketDistribution(featured[0].id) 
    : [];

  const totalRegistered = stats.reduce((sum, row) => sum + row.s.registered, 0);
  const totalCheckedIn = stats.reduce((sum, row) => sum + row.s.checkedIn, 0);
  const totalRevenue = stats.reduce((sum, row) => sum + row.s.revenue, 0);
  const openTasks = tasks.filter((t) => t.status !== "complete");

  return (
    <div className="space-y-12">
      {/* ---------- Greeting ---------- */}
      <section>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="eyebrow text-[0.625rem] text-[var(--color-brass-deep)]">
              Organization dashboard
            </div>
            <h1 className="font-display mt-3.5 text-[clamp(2.15rem,4.2vw,3.15rem)] leading-[1.04] font-semibold tracking-[-0.022em] text-ink">
              Welcome back, {org.name.split(" ")[0]} team.
            </h1>
            <p className="mt-4 max-w-[38rem] text-[1.025rem] leading-[1.72] text-warm-600">
              You have{" "}
              <strong className="font-semibold text-ink">
                {featured.length} active events
              </strong>{" "}
              and{" "}
              <strong className="font-semibold text-ink">
                {openTasks.length} open tasks
              </strong>
              . Everything you set up is saved as a blueprint for the next one.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/events/new" className="btn btn-primary">
              <Plus size={17} /> Create event
            </Link>
            {featured[0] && (
              <Link
                href={`/dashboard/events/${featured[0].id}/command`}
                className="btn btn-ghost"
              >
                <QrCode size={17} /> Open check-in
              </Link>
            )}
            <button type="button" className="btn btn-ghost">
              <Download size={17} /> Export
            </button>
          </div>
        </div>

        {/* Stat strip */}
        <div className="mt-10 grid gap-px overflow-hidden rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-[rgba(22,19,17,0.1)] sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Registrations (active events)",
              value: formatNumber(totalRegistered),
              detail: `${formatNumber(totalCheckedIn)} checked in`,
              icon: Users,
            },
            {
              label: "Collected",
              value: formatMoney(totalRevenue, org.currency),
              detail: "Verified through the gateway",
              icon: TrendingUp,
            },
            {
              label: "Reusable blueprints",
              value: String(blueprints.length),
              detail: "Ready for your next event",
              icon: FileStack,
            },
            {
              label: "Tasks needing attention",
              value: String(openTasks.length),
              detail: `${openTasks.filter((t) => t.status === "blocked").length} blocked`,
              icon: TriangleAlert,
            },
          ].map((item) => (
            <div key={item.label} className="bg-paper p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="eyebrow max-w-[13rem] text-[0.585rem] leading-[1.7] text-warm-400">
                  {item.label}
                </div>
                <item.icon size={19} className="text-[var(--color-brass-deep)]" />
              </div>
              <div className="tnum font-display mt-4 text-[2.15rem] leading-none font-semibold text-ink">
                {item.value}
              </div>
              <div className="mt-2.5 text-[0.8125rem] text-warm-500">
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Events ledger ---------- */}
      <section id="events" className="scroll-mt-24">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <SectionHead
            eyebrow="Your events"
            title="Everything on the calendar."
            description="Readiness is a factual configuration status — what is set up, and what still needs your attention."
          />
          <Link href="/dashboard/blueprints" className="btn btn-ghost shrink-0">
            All events <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-9 overflow-hidden rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-paper">
          <div className="overflow-x-auto">
            <table className="ledger">
              <thead>
                <tr>
                  <th scope="col">Event</th>
                  <th scope="col">Dates</th>
                  <th scope="col">Status</th>
                  <th scope="col">Registered</th>
                  <th scope="col">Readiness</th>
                  <th scope="col" className="text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, i) => {
                  const stat = stats.find((row) => row.event.id === event.id);
                  return (
                    <tr key={event.id}>
                      <td>
                        <div className="flex items-center gap-3.5">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[9px]">
                            <Image
                              src={
                                event.coverImage ?? "/images/event-stage.jpg"
                              }
                              alt=""
                              aria-hidden="true"
                              className="object-cover"
                              fill
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-ink">
                              {event.title}
                            </div>
                            <div className="truncate text-[0.795rem] text-warm-400">
                              {event.venueName} · {event.city}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="tnum whitespace-nowrap text-warm-500">
                        {formatRange(event.startsAt, event.endsAt)}
                      </td>
                      <td>
                        <span
                          className={
                            event.status === "published"
                              ? "pill pill-live"
                              : event.status === "completed"
                                ? "pill pill-neutral"
                                : "pill pill-warn"
                          }
                        >
                          {titleCase(event.status)}
                        </span>
                      </td>
                      <td className="tnum font-semibold text-ink">
                        {formatNumber(stat?.s.registered ?? 0)}
                        <span className="ml-1.5 text-[0.795rem] font-normal text-warm-400">
                          / {formatNumber(event.capacity)}
                        </span>
                      </td>
                      <td className="min-w-[10rem]">
                        <div className="flex items-center gap-3">
                          <ProgressBar
                            value={event.readiness}
                            tone={
                              event.readiness >= 80
                                ? "green"
                                : event.readiness >= 55
                                  ? "brass"
                                  : "red"
                            }
                          />
                          <span className="tnum text-[0.795rem] font-semibold text-warm-600">
                            {event.readiness}%
                          </span>
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/e/${event.slug}`}
                            className="pill pill-neutral transition-colors hover:text-ink"
                          >
                            Page
                          </Link>
                          <Link
                            href={`/dashboard/events/${event.id}`}
                            className="pill pill-brass"
                          >
                            Manage
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------- Readiness + activity ---------- */}
      <section className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        <div className="rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-paper">
          <div className="flex items-start justify-between gap-5 border-b border-[rgba(22,19,17,0.1)] px-7 py-6">
            <div>
              <div className="eyebrow text-[0.585rem] text-warm-400">
                Event health {featured[0] ? `· ${featured[0].title}` : ""}
              </div>
              <h2 className="font-display mt-3 text-[1.52rem] leading-tight font-semibold text-ink">
                Readiness checklist
              </h2>
            </div>
            {featured[0] && (
              <Link
                href={`/dashboard/events/${featured[0].id}`}
                className="pill pill-brass"
              >
                Open event <ArrowUpRight size={12} />
              </Link>
            )}
          </div>

          <ul>
            {[
              {
                label: "Registration",
                value: "Open until 15 Mar 2027",
                state: "complete" as const,
              },
              {
                label: "Payment gateway",
                value: "Paystack connected (test mode)",
                state: "complete" as const,
              },
              {
                label: "Speakers",
                value: "8 of 8 profiles complete",
                state: "complete" as const,
              },
              {
                label: "Volunteers",
                value: `${stats[0]?.s.confirmedVolunteers ?? 0} of ${
                  stats[0]?.s.volunteerCount ?? 0
                } confirmed`,
                state: "warning" as const,
              },
              {
                label: "Accommodation",
                value: `${stats[0]?.s.accommodation ?? 0} delegates requiring rooms`,
                state: "complete" as const,
              },
              {
                label: "Transportation",
                value: "2 buses still unassigned",
                state: "warning" as const,
              },
              {
                label: "Communication timeline",
                value: "4 messages scheduled",
                state: "complete" as const,
              },
              {
                label: "Certificates",
                value: "Configured · attendance threshold 80%",
                state: "complete" as const,
              },
            ].map((row) => (
              <li
                key={row.label}
                className="flex items-center gap-4 border-t border-[rgba(22,19,17,0.08)] px-7 py-4 first:border-t-0"
              >
                <span
                  className={
                    row.state === "complete"
                      ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(47,107,79,0.13)]"
                      : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(184,121,28,0.15)]"
                  }
                >
                  {row.state === "complete" ? (
                    <CheckCircle2
                      size={15}
                      className="text-[var(--color-signal-green)]"
                    />
                  ) : (
                    <TriangleAlert
                      size={15}
                      className="text-[var(--color-signal-amber)]"
                    />
                  )}
                </span>
                <span className="flex-1 text-[0.905rem] font-medium text-ink">
                  {row.label}
                </span>
                <span className="text-right text-[0.8125rem] text-warm-500">
                  {row.value}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-8">
          {/* Ticket distribution — real seeded figures */}
          <div className="rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-paper p-7">
            <div className="eyebrow text-[0.585rem] text-warm-400">
              Ticket distribution
            </div>
            <h2 className="font-display mt-3 text-[1.38rem] leading-tight font-semibold text-ink">
              {featured[0]?.title ?? "No upcoming events"}
            </h2>

            <div className="mt-7 space-y-5">
              {ticketDist.length > 0 ? (
                ticketDist.map((row) => (
                  <div key={row.name}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[0.845rem] font-medium text-ink">
                        {row.name}
                      </span>
                      <span className="tnum text-[0.795rem] text-warm-400">
                        {formatNumber(row.sold)} / {formatNumber(row.capacity)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar
                        value={percent(row.sold, row.capacity)}
                        tone={row.sold / row.capacity > 0.8 ? "green" : "brass"}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[0.845rem] text-warm-400">
                  No ticket tiers defined.
                </div>
              )}
            </div>

            {ticketDist.some(row => row.sold / row.capacity > 0.8) && (
              <div className="mt-8 flex items-start gap-3 rounded-[11px] bg-[rgba(192,138,46,0.08)] p-4">
                <Radio
                  size={17}
                  className="mt-0.5 shrink-0 text-[var(--color-brass-deep)]"
                />
                <p className="text-[0.805rem] leading-[1.7] text-warm-600">
                  {ticketDist.filter(row => row.sold / row.capacity > 0.8).map(row => row.name).join(", ")} is filling fastest relative to capacity.
                  Consider opening additional reserved places.
                </p>
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-paper">
            <div className="flex items-center justify-between gap-4 border-b border-[rgba(22,19,17,0.1)] px-7 py-5">
              <h2 className="font-display text-[1.22rem] font-semibold text-ink">
                Recent activity
              </h2>
              <span className="pill pill-neutral">Audit log</span>
            </div>
            <ul>
              {audit.slice(0, 6).map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start gap-3.5 border-t border-[rgba(22,19,17,0.08)] px-7 py-4 first:border-t-0"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brass)]" />
                  <div className="min-w-0">
                    <div className="text-[0.845rem] leading-snug text-ink">
                      <strong className="font-semibold">{entry.actor}</strong>{" "}
                      {entry.action.toLowerCase()}
                    </div>
                    <div className="mt-1 truncate text-[0.755rem] text-warm-400">
                      {entry.detail}
                    </div>
                  </div>
                  <span className="ml-auto shrink-0 text-[0.715rem] whitespace-nowrap text-warm-300">
                    {relativeDays(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Tasks ---------- */}
      <section id="teams" className="scroll-mt-24">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <SectionHead
            eyebrow="Tasks & teams"
            title="What still needs doing."
            description="Tasks are tied to the event they belong to, with an owner and a due date."
          />
          <button type="button" className="btn btn-ghost shrink-0">
            <Plus size={16} /> New task
          </button>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {openTasks.slice(0, 8).map((task, i) => (
            <Reveal key={task.id} delay={i * 0.05}>
              <div className="flex h-full flex-col rounded-[13px] border border-[rgba(22,19,17,0.1)] bg-paper p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="pill pill-neutral !text-[0.645rem]">
                    {task.category}
                  </span>
                  <span
                    className={
                      task.priority === "high"
                        ? "pill pill-alert !text-[0.625rem]"
                        : "pill pill-neutral !text-[0.625rem]"
                    }
                  >
                    {titleCase(task.priority)}
                  </span>
                </div>

                <h3 className="mt-4 text-[0.925rem] leading-[1.55] font-semibold text-ink">
                  {task.title}
                </h3>

                <div className="mt-auto pt-6">
                  <div className="flex items-center justify-between border-t border-[rgba(22,19,17,0.09)] pt-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(192,138,46,0.15)] text-[0.645rem] font-semibold text-[var(--color-brass-deep)]">
                        {task.assignee
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <span className="text-[0.775rem] text-warm-500">
                        {task.assignee}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[0.735rem] text-warm-400">
                      <Clock size={12} />
                      {task.dueAt ? formatDate(task.dueAt) : "No date"}
                    </span>
                  </div>
                  <div
                    className={
                      task.status === "in_progress"
                        ? "pill pill-warn mt-4 !text-[0.645rem]"
                        : task.status === "blocked"
                          ? "pill pill-alert mt-4 !text-[0.645rem]"
                          : "pill pill-neutral mt-4 !text-[0.645rem]"
                    }
                  >
                    {titleCase(task.status.replace("_", " "))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Blueprints CTA ---------- */}
      <section id="analytics" className="scroll-mt-24">
        <div className="relative overflow-hidden rounded-[18px] bg-cypress px-8 py-12 text-parchment sm:px-12">
          <div className="grain pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <div className="eyebrow text-[0.585rem] text-brass-light">
                Organization memory
              </div>
              <h2 className="font-display mt-4 text-[clamp(1.85rem,3.4vw,2.55rem)] leading-[1.1] font-semibold">
                Your next event is already half-built.
              </h2>
              <p className="mt-5 max-w-[36rem] text-[1.005rem] leading-[1.78] text-[rgba(247,243,236,0.78)]">
                {blueprints.length} saved blueprints, {formatNumber(stats[0]?.s.sessionCount ?? 0)}{" "}
                sessions, and custom questions you&apos;ve used — ready to start from, never applied without
                your confirmation.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/dashboard/blueprints" className="btn btn-brass">
                  <Compass size={17} /> Browse the library
                </Link>
                {featured[0] && (
                  <Link
                    href={`/e/${featured[0].slug}`}
                    className="btn btn-light"
                  >
                    <CalendarDays size={17} /> View public page
                  </Link>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              {blueprints.slice(0, 3).map((blueprint) => (
                <div
                  key={blueprint.id}
                  className="rounded-[13px] border border-[rgba(232,211,166,0.22)] bg-[rgba(247,243,236,0.07)] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[0.975rem] leading-snug font-semibold text-parchment">
                        {blueprint.name}
                      </h3>
                      <p className="mt-1.5 text-[0.795rem] leading-[1.62] text-[rgba(247,243,236,0.68)]">
                        {(blueprint.includes ?? []).slice(0, 3).join(" · ")}
                      </p>
                    </div>
                    <span className="pill border-[rgba(232,211,166,0.24)] bg-[rgba(232,211,166,0.12)] text-brass-light">
                      Used {blueprint.useCount}×
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
