import Link from "next/link";
import { SelahMark } from "@/components/logo";

const columns: { title: string; items: string[] }[] = [
  {
    title: "Platform",
    items: [
      "Event pages & registration",
      "Payments & tickets",
      "QR check-in",
      "Volunteers & operations",
      "Communications timeline",
    ],
  },
  {
    title: "Built for",
    items: [
      "Churches & congregations",
      "Conferences & conventions",
      "Retreats & camps",
      "Bible schools & training",
      "Ministries & fellowships",
    ],
  },
  {
    title: "Company",
    items: [
      "About Selah",
      "Security & privacy",
      "Data processing",
      "Status",
      "Contact",
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-cypress text-parchment">
      <div className="grain pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto w-full max-w-[1240px] px-5 pt-20 pb-12 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.45fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <SelahMark tone="light" className="h-11 w-11" />
              <div>
                <div className="font-display text-[1.55rem] leading-none font-semibold">
                  Selah
                </div>
                <div className="eyebrow mt-1 text-[0.56rem] text-brass-light opacity-80">
                  Christian Event Operating System
                </div>
              </div>
            </div>
            <p className="mt-6 max-w-sm text-[0.95rem] leading-[1.8] text-[rgba(247,243,236,0.72)]">
              Denomination-neutral software for the gatherings of the church —
              planned once, reused for years. Built with care for the people who
              make events happen.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span className="pill border-[rgba(232,211,166,0.24)] bg-[rgba(232,211,166,0.1)] text-brass-light">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brass opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brass" />
                </span>
                All systems operational
              </span>
              <span className="pill border-[rgba(247,243,236,0.16)] bg-[rgba(247,243,236,0.06)] text-[rgba(247,243,236,0.72)]">
                Paystack · Stripe-ready architecture
              </span>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="eyebrow text-[0.625rem] text-brass-light">
                {col.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.items.map((item) => (
                  <li key={item}>
                    <Link
                      href="/"
                      className="text-[0.9125rem] leading-relaxed text-[rgba(247,243,236,0.7)] transition-colors hover:text-brass-light"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 h-px w-full bg-[rgba(232,211,166,0.22)]" />

        <div className="mt-8 flex flex-col gap-5 text-[0.8125rem] text-[rgba(247,243,236,0.6)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Selah Event Systems. Demonstration
            product — all organisations, people and figures shown are fictional.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/" className="transition-colors hover:text-brass-light">
              Privacy
            </Link>
            <Link href="/" className="transition-colors hover:text-brass-light">
              Terms
            </Link>
            <Link
              href="/verify/GF-KLS27-10432"
              className="transition-colors hover:text-brass-light"
            >
              Verify a certificate
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
