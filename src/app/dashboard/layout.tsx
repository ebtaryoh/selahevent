import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Compass,
  LayoutDashboard,
  QrCode,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { SelahMark } from "@/components/logo";
import { getOrganization } from "@/lib/data";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatDate } from "@/lib/format";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";




export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = await getOrganization();
  if (!org) {
    redirect("/login");
  }

  // Find the most recent published event for the command center link
  const latestEvent = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.organizationId, org.id))
    .orderBy(desc(events.startsAt))
    .limit(1)
    .then((r) => r[0] ?? null);

  const commandHref = latestEvent
    ? `/dashboard/events/${latestEvent.id}/command`
    : "/dashboard/events";

  const nav = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Events", href: "/dashboard#events", icon: CalendarDays },
    { label: "Command Center", href: commandHref, icon: QrCode, badge: "Live" },
    { label: "Organization Memory", href: "/dashboard/blueprints", icon: Compass },
    { label: "People & teams", href: "/dashboard/team", icon: Users },
    { label: "Analytics", href: "/dashboard#analytics", icon: BarChart3 },
  ];


  return (
    <div className="min-h-screen bg-parchment">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col border-r border-[rgba(22,19,17,0.09)] bg-paper lg:flex">
        <div className="flex items-center gap-3 border-b border-[rgba(22,19,17,0.09)] px-6 py-6">
          <SelahMark className="h-9 w-9" />
          <div>
            <div className="font-display text-[1.125rem] leading-none font-semibold text-ink">
              Selah
            </div>
            <div className="eyebrow mt-1 text-[0.5rem] text-warm-400">
              Event Operating System
            </div>
          </div>
        </div>

        <div className="px-5 pt-6">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-[11px] border border-[rgba(22,19,17,0.11)] bg-parchment px-3.5 py-3 text-left transition-colors hover:border-[rgba(192,138,46,0.5)]"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[0.72rem] font-bold text-white"
              style={{ background: org?.primaryColor ?? "#0e2a22" }}
            >
              {(org?.name ?? "Grace Fellowship")
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8125rem] font-semibold text-ink">
                {org?.name ?? "Grace Fellowship"}
              </span>
              <span className="block truncate text-[0.695rem] text-warm-400">
                {org?.plan === "growth" ? "Growth plan" : "Free plan"} ·{" "}
                {org?.currency ?? "NGN"}
              </span>
            </span>
            <ChevronRight size={15} className="text-warm-400" />
          </button>
        </div>

        <nav className="mt-6 flex-1 px-4" aria-label="Dashboard">
          <div className="eyebrow px-3 pb-3 text-[0.525rem] text-warm-300">
            Workspace
          </div>
          <ul className="space-y-1">
            {nav.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[0.845rem] font-medium text-warm-600 transition-colors hover:bg-[rgba(192,138,46,0.1)] hover:text-ink"
                >
                  <item.icon
                    size={17}
                    strokeWidth={1.8}
                    className="text-warm-400 transition-colors group-hover:text-[var(--color-brass-deep)]"
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="pill pill-live !px-2 !py-0.5 !text-[0.6rem]">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>

          <div className="eyebrow px-3 pt-7 pb-3 text-[0.525rem] text-warm-300">
            Trust
          </div>
          <ul className="space-y-1">
            <li>
              <Link
                href="/verify/GF-KLS27-10432"
                className="group flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[0.845rem] font-medium text-warm-600 transition-colors hover:bg-[rgba(192,138,46,0.1)] hover:text-ink"
              >
                <ShieldCheck
                  size={17}
                  strokeWidth={1.8}
                  className="text-warm-400 group-hover:text-[var(--color-brass-deep)]"
                />
                Certificate verification
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="group flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[0.845rem] font-medium text-warm-600 transition-colors hover:bg-[rgba(192,138,46,0.1)] hover:text-ink"
              >
                <Settings2
                  size={17}
                  strokeWidth={1.8}
                  className="text-warm-400 group-hover:text-[var(--color-brass-deep)]"
                />
                Organization settings
              </Link>
            </li>
          </ul>
        </nav>

        <div className="border-t border-[rgba(22,19,17,0.09)] p-4">
          <div className="flex items-center gap-3 rounded-[11px] bg-parchment px-3.5 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cypress text-[0.72rem] font-semibold text-brass-light">
              AN
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.795rem] font-semibold text-ink">
                Adaeze Nwosu
              </div>
              <div className="truncate text-[0.695rem] text-warm-400">
                Organization Owner
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-[rgba(22,19,17,0.09)] bg-paper px-4 py-3 lg:hidden">
        <SelahMark className="h-8 w-8" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[0.8125rem] font-semibold text-ink">
            {org?.name ?? "Grace Fellowship"}
          </div>
          <div className="truncate text-[0.695rem] text-warm-400">
            {formatDate(new Date())}
          </div>
        </div>
        <Link
          href={commandHref}
          className="pill pill-live"
        >
          <QrCode size={12} /> Command
        </Link>
      </div>

      <div className="lg:pl-[252px]">
        <header className="hidden items-center justify-between gap-6 border-b border-[rgba(22,19,17,0.09)] bg-parchment px-8 py-5 lg:flex">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute top-1/2 left-3.5 -translate-y-1/2 text-warm-400"
              />
              <input
                type="search"
                placeholder="Search events, attendees, templates…"
                aria-label="Search"
                className="input !w-[22rem] !rounded-full !py-2.5 !pl-10 !text-[0.825rem]"
              />
            </div>
            <span className="pill pill-neutral hidden xl:inline-flex">
              ⌘K
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="text-[0.8125rem] font-semibold text-ink">
                {formatDate(new Date(), {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
              <div className="text-[0.715rem] text-warm-400">
                {org?.timezone ?? "Africa/Lagos"}
              </div>
            </div>
            <Link href="/" className="btn btn-ghost !px-4.5 !py-2.5 !text-[0.8125rem]">
              View public site
            </Link>
            <Link
              href="/dashboard/events/new"
              className="btn btn-primary !px-4.5 !py-2.5 !text-[0.8125rem]"
            >
              <Plus size={15} /> Create Event
            </Link>
          </div>
        </header>

        <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
