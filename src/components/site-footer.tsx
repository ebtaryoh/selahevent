import Link from "next/link";
import { SelahMark } from "@/components/logo";
import { Sparkles, Heart } from "lucide-react";

const columns: { title: string; items: { label: string; href: string }[] }[] = [
  {
    title: "Sanctuary Platform",
    items: [
      { label: "Find My Pass", href: "/my-tickets" },
      { label: "Daily Sanctuary & Prayer Wall", href: "/sanctuary" },
      { label: "Event Pages & Registration", href: "/" },
      { label: "QR Check-in & Gatekeeping", href: "/dashboard" },
      { label: "Volunteer & Table Seating", href: "/dashboard" },
    ],
  },
  {
    title: "Ministries & Congregations",
    items: [
      { label: "Churches & Assemblies", href: "/for-ministries" },
      { label: "Conferences & Summits", href: "/for-ministries" },
      { label: "Camp Meetings & Retreats", href: "/for-ministries" },
      { label: "Bible Colleges & Seminaries", href: "/for-ministries" },
      { label: "Youth & Campus Fellowships", href: "/for-ministries" },
    ],
  },
  {
    title: "Kingdom Stewardship",
    items: [
      { label: "Host an Event", href: "/register" },
      { label: "Security & Attendee Privacy", href: "#" },
      { label: "Faithful Data Processing", href: "#" },
      { label: "Ministry Support", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-parchment-deep border-t border-[var(--nav-border)] text-ink transition-colors duration-300">
      <div className="grain pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto w-full max-w-[1240px] px-5 pt-16 pb-12 sm:px-8">
        {/* Apostolic Benediction Banner */}
        <div className="mb-14 rounded-2xl border border-brass/25 bg-brass/5 p-6 sm:p-8 text-center backdrop-blur-md">
          <div className="mx-auto inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brass mb-3">
            <Sparkles size={13} className="text-brass-light" />
            <span>Apostolic Benediction · 2 Corinthians 13:14</span>
          </div>
          <blockquote className="font-display text-base sm:text-lg italic text-ink/90 max-w-2xl mx-auto leading-relaxed">
            &ldquo;The grace of the Lord Jesus Christ, and the love of God, and the communion of the Holy Ghost, be with you all. Amen.&rdquo;
          </blockquote>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.45fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" title="Selah Home" className="group flex items-center gap-3 transition-opacity hover:opacity-90">
              <SelahMark className="h-11 w-11 transition-transform group-hover:scale-105" />
              <div>
                <div className="font-display text-[1.55rem] leading-none font-semibold text-ink group-hover:text-brass transition-colors">
                  Selah
                </div>
                <div className="eyebrow mt-1 text-[0.56rem] text-brass uppercase font-bold tracking-widest">
                  Christian Event Operating System
                </div>
              </div>
            </Link>
            <p className="mt-6 max-w-sm text-[0.925rem] leading-[1.8] text-warm-500 font-light">
              Christ-centered digital sanctuary and event operating system for the global church — planned once, reused for years. Built with reverent care for ministry stewards.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span className="pill border-brass/30 bg-brass/10 text-brass font-semibold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brass opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brass" />
                </span>
                Sanctuary Operational
              </span>
              <span className="pill border-[var(--card-border)] bg-[var(--card-bg)] text-warm-500 font-medium">
                Paystack Verified
              </span>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="eyebrow text-[0.68rem] text-brass font-bold uppercase tracking-widest">
                {col.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-[0.9rem] leading-relaxed text-warm-500 transition-colors hover:text-brass"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 h-px w-full bg-[var(--card-border)]" />

        <div className="mt-8 flex flex-col gap-5 text-[0.8125rem] text-warm-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Selah Event Systems. Operating for the Body of Christ worldwide.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/my-tickets" className="transition-colors hover:text-brass font-medium">
              Find My Pass
            </Link>
            <Link href="/sanctuary" className="transition-colors hover:text-brass font-medium">
              Daily Sanctuary
            </Link>
            <Link href="/for-ministries" className="transition-colors hover:text-brass font-medium">
              For Ministries
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
