import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  Copy,
  History,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Reveal, SectionHead, StatBlock, CountUp } from "@/components/ui";
import {
  getAuditLogs,
  getBlueprints,
  getEventsForOrganization,
  getOrganization,
} from "@/lib/data";
import { formatDate, formatNumber, relativeDays } from "@/lib/format";

export const dynamic = "force-dynamic";

const memoryCategories = [
  {
    title: "Registration & forms",
    count: 9,
    items: [
      "General conference form (14 fields)",
      "Youth retreat form with guardian consent",
      "Marriage seminar couple registration",
      "Volunteer application form",
      "Dietary & accessibility questions",
    ],
  },
  {
    title: "Speakers & content",
    count: 18,
    items: [
      "Speaker profiles with bios and topics",
      "Session structures by track",
      "Worship set planning notes",
      "Workshop facilitator guidelines",
      "Session recordings index",
    ],
  },
  {
    title: "Operations",
    count: 14,
    items: [
      "12 volunteer departments",
      "Shift patterns & team-lead structure",
      "6 transport routes with contacts",
      "4 accommodation facilities",
      "Check-in gate configuration",
    ],
  },
  {
    title: "Communication",
    count: 11,
    items: [
      "T-30 to T+7 timeline (6 touches)",
      "Registration confirmation email",
      "Payment confirmation email",
      "Event-day welcome message",
      "Certificate-ready notification",
    ],
  },
];

export default async function BlueprintsPage() {
  const org = await getOrganization();
  if (!org) return null;

  const [blueprints, events, audit] = await Promise.all([
    getBlueprints(org.id),
    getEventsForOrganization(org.id),
    getAuditLogs(org.id, 8),
  ]);

  return (
    <div className="space-y-12">
      <section>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="eyebrow text-[0.625rem] text-[var(--color-brass-deep)]">
              Organization memory
            </div>
            <h1 className="font-display mt-3.5 max-w-[24ch] text-[clamp(2.15rem,4.4vw,3.25rem)] leading-[1.05] font-semibold tracking-[-0.022em] text-ink">
              Everything your team has already built.
            </h1>
            <p className="mt-5 max-w-[42rem] text-[1.045rem] leading-[1.75] text-warm-600">
              Blueprints, templates, speaker profiles, venues and communication
              timelines are remembered here. Nothing is reused without an
              explicit action — and anything can be edited or removed.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn btn-primary">
              <Sparkles size={17} /> Start a new event
            </Link>
            <button type="button" className="btn btn-ghost">
              <Copy size={17} /> Import a template
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-[rgba(22,19,17,0.1)] sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Saved blueprints", value: blueprints.length, note: "Across 5 event categories" },
            { label: "Speaker profiles", value: 18, note: "Bios, topics, sessions" },
            { label: "Communication templates", value: 11, note: "Email & SMS" },
            { label: "Events on record", value: events.length, note: "Full history retained" },
          ].map((item) => (
            <div key={item.label} className="bg-paper p-7">
              <div className="eyebrow text-[0.585rem] text-warm-400">
                {item.label}
              </div>
              <div className="font-display tnum mt-3.5 text-[2.35rem] leading-none font-semibold text-ink">
                <CountUp value={item.value} />
              </div>
              <div className="mt-2.5 text-[0.8125rem] text-warm-500">
                {item.note}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Blueprints */}
      <section>
        <SectionHead
          eyebrow="Event blueprints"
          title="Start from something that already works."
          description="A blueprint carries structure, not just content — registration, tickets, schedule shape, teams, communications and certificates."
        />

        <div className="mt-9 grid gap-6 lg:grid-cols-2">
          {blueprints.map((blueprint, i) => (
            <Reveal key={blueprint.id} delay={i * 0.06}>
              <article className="group flex h-full flex-col rounded-[16px] border border-[rgba(22,19,17,0.11)] bg-paper p-8 transition-shadow duration-300 hover:shadow-[0_32px_64px_-34px_rgba(14,42,34,0.55)]">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <span className="pill pill-brass">{blueprint.category}</span>
                    <h3 className="font-display mt-4 text-[1.42rem] leading-tight font-semibold text-ink">
                      {blueprint.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="tnum font-display text-[1.85rem] leading-none font-semibold text-[var(--color-brass-deep)]">
                      {blueprint.useCount}×
                    </div>
                    <div className="mt-1 text-[0.715rem] text-warm-400">
                      used
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-[0.905rem] leading-[1.75] text-warm-600">
                  {blueprint.description}
                </p>

                <ul className="mt-6 flex flex-wrap gap-2">
                  {(blueprint.includes ?? []).map((include) => (
                    <li
                      key={include}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(22,19,17,0.11)] bg-parchment px-3 py-1.5 text-[0.745rem] font-medium text-warm-600"
                    >
                      <Check size={11} className="text-[var(--color-brass-deep)]" />
                      {include}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex items-center justify-between gap-4 border-t border-[rgba(22,19,17,0.1)] pt-6">
                  <div className="flex items-center gap-2 text-[0.795rem] text-warm-400">
                    <History size={13} />
                    Last used{" "}
                    {blueprint.lastUsedAt
                      ? relativeDays(blueprint.lastUsedAt).toLowerCase()
                      : "never"}
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary !px-5 !py-2.5 !text-[0.8125rem]"
                  >
                    Use blueprint <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Memory categories */}
      <section>
        <SectionHead
          eyebrow="The library"
          title="What Selah remembers for you."
          description="Organised by the kind of work it supports, so the right starting point is never more than a click away."
        />

        <div className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {memoryCategories.map((category, i) => (
            <Reveal key={category.title} delay={i * 0.05}>
              <div className="flex h-full flex-col rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-paper p-7">
                <div className="flex items-start justify-between gap-4">
                  <Compass
                    size={21}
                    className="text-[var(--color-brass-deep)]"
                  />
                  <span className="tnum text-[0.795rem] font-semibold text-warm-400">
                    {category.count} saved
                  </span>
                </div>

                <h3 className="font-display mt-5 text-[1.185rem] leading-tight font-semibold text-ink">
                  {category.title}
                </h3>

                <ul className="mt-5 space-y-3">
                  {category.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[0.825rem] leading-[1.62] text-warm-600"
                    >
                      <Check
                        size={13}
                        className="mt-[0.28rem] shrink-0 text-[var(--color-brass-deep)]"
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="mt-auto inline-flex items-center gap-2 pt-6 text-[0.8125rem] font-semibold text-[var(--color-brass-deep)]"
                >
                  Browse all <ArrowUpRight size={14} />
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Recent reuse */}
      <section>
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="overflow-hidden rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-paper">
            <div className="flex items-center justify-between gap-4 border-b border-[rgba(22,19,17,0.1)] px-7 py-5">
              <h2 className="font-display text-[1.22rem] font-semibold text-ink">
                Recent reuse across the organization
              </h2>
              <span className="pill pill-neutral">Last 90 days</span>
            </div>
            <ul>
              {[
                {
                  what: "Annual Leadership Conference blueprint",
                  detail: "Used to draft Kingdom Leadership Summit 2027",
                  when: "2 weeks ago",
                },
                {
                  what: "Speaker profile · Dr. Hannah Osei",
                  detail: "Added to Kingdom Leadership Summit 2027",
                  when: "3 weeks ago",
                },
                {
                  what: "Communication timeline · T-30 → T+7",
                  detail: "Applied to Kingdom Leadership Summit 2027",
                  when: "1 month ago",
                },
                {
                  what: "Youth Retreat registration form",
                  detail: "Used to draft Annual Youth Retreat 2027",
                  when: "1 month ago",
                },
                {
                  what: "Certificate design · Attendance ≥ 80%",
                  detail: "Reused without changes",
                  when: "2 months ago",
                },
              ].map((row) => (
                <li
                  key={row.what}
                  className="flex items-start gap-4 border-t border-[rgba(22,19,17,0.08)] px-7 py-4 first:border-t-0"
                >
                  <Users
                    size={17}
                    className="mt-0.5 shrink-0 text-warm-300"
                  />
                  <div className="flex-1">
                    <div className="text-[0.895rem] font-semibold text-ink">
                      {row.what}
                    </div>
                    <div className="mt-1 text-[0.795rem] text-warm-500">
                      {row.detail}
                    </div>
                  </div>
                  <span className="shrink-0 text-[0.755rem] text-warm-400">
                    {row.when}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-paper">
            <div className="flex items-center justify-between gap-4 border-b border-[rgba(22,19,17,0.1)] px-7 py-5">
              <h2 className="font-display text-[1.22rem] font-semibold text-ink">
                Retention controls
              </h2>
              <span className="pill pill-live">Active</span>
            </div>

            <div className="space-y-6 p-7">
              {[
                {
                  title: "Attendee history",
                  body: "Kept for 24 months after an attendee's last event, then removed automatically unless a longer period is required.",
                  on: true,
                },
                {
                  title: "Sensitive fields",
                  body: "Emergency contacts, dietary and medical notes are purged 90 days after an event ends.",
                  on: true,
                },
                {
                  title: "Blueprint auto-suggestion",
                  body: "Selah suggests reusing past configurations but never applies them without confirmation.",
                  on: true,
                },
                {
                  title: "Marketing use",
                  body: "Attendee details are never used for marketing by Selah. Disabled permanently.",
                  on: true,
                },
              ].map((row) => (
                <div
                  key={row.title}
                  className="flex items-start justify-between gap-5 border-t border-[rgba(22,19,17,0.09)] pt-5 first:border-t-0 first:pt-0"
                >
                  <div>
                    <h3 className="text-[0.905rem] font-semibold text-ink">
                      {row.title}
                    </h3>
                    <p className="mt-1.5 text-[0.8125rem] leading-[1.7] text-warm-500">
                      {row.body}
                    </p>
                  </div>
                  <span className="pill pill-live shrink-0">
                    {row.on ? "On" : "Off"}
                  </span>
                </div>
              ))}

              <div className="rounded-[11px] bg-[rgba(192,138,46,0.08)] p-4">
                <p className="text-[0.805rem] leading-[1.7] text-warm-600">
                  Last policy review:{" "}
                  <strong className="font-semibold text-ink">
                    {formatDate(new Date("2027-01-14T09:00:00Z"))}
                  </strong>{" "}
                  · {formatNumber(0)} data export requests outstanding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audit */}
      <section>
        <div className="overflow-hidden rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-paper">
          <div className="flex items-center justify-between gap-4 border-b border-[rgba(22,19,17,0.1)] px-7 py-5">
            <h2 className="font-display text-[1.22rem] font-semibold text-ink">
              Organization audit log
            </h2>
            <span className="pill pill-neutral">
              {audit.length} recent entries
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="ledger">
              <thead>
                <tr>
                  <th scope="col">Actor</th>
                  <th scope="col">Action</th>
                  <th scope="col">Detail</th>
                  <th scope="col">When</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((entry) => (
                  <tr key={entry.id}>
                    <td className="font-semibold text-ink">{entry.actor}</td>
                    <td>
                      <span className="pill pill-brass">{entry.action}</span>
                    </td>
                    <td className="text-warm-500">{entry.detail}</td>
                    <td className="tnum whitespace-nowrap text-warm-400">
                      {formatDate(entry.createdAt, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      } as Intl.DateTimeFormatOptions)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
