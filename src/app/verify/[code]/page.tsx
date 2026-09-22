import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  MapPin,
  SearchX,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SelahMark } from "@/components/logo";
import { getCertificate } from "@/lib/data";
import { formatDate, formatRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Certificate verification",
  description:
    "Verify the authenticity of a certificate issued by an organisation running Selah.",
  robots: { index: false, follow: true },
};

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const result = await getCertificate(decodeURIComponent(code));

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <header className="border-b border-[rgba(22,19,17,0.09)] bg-paper">
        <div className="mx-auto flex w-full max-w-[900px] items-center justify-between gap-5 px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <SelahMark className="h-9 w-9" />
            <div>
              <div className="font-display text-[1.125rem] leading-none font-semibold text-ink">
                Selah
              </div>
              <div className="eyebrow mt-1 text-[0.515rem] text-warm-400">
                Certificate verification
              </div>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[0.8125rem] font-semibold text-warm-500 transition-colors hover:text-ink"
          >
            <ArrowLeft size={15} /> Back to Selah
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col justify-center px-5 py-16 sm:px-8">
        {result ? (
          <div className="card overflow-hidden">
            <div className="relative overflow-hidden bg-cypress px-8 py-12 text-center text-parchment sm:px-12">
              <div className="grain pointer-events-none absolute inset-0 opacity-60" />
              <div className="relative">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(232,211,166,0.42)] bg-[rgba(232,211,166,0.16)]">
                  <BadgeCheck size={32} className="text-brass-light" />
                </span>
                <h1 className="font-display mt-6 text-[clamp(2rem,4.5vw,2.75rem)] leading-[1.08] font-semibold">
                  Certificate verified.
                </h1>
                <p className="mx-auto mt-4 max-w-[32rem] text-[1.025rem] leading-[1.72] text-[rgba(247,243,236,0.82)]">
                  This certificate was issued by{" "}
                  <strong className="font-semibold text-brass-light">
                    {result.organization.name}
                  </strong>{" "}
                  and is recorded in the issuing organisation&apos;s register.
                </p>
              </div>
            </div>

            <div className="px-8 py-10 sm:px-12">
              <dl className="grid gap-0 sm:grid-cols-2">
                {[
                  [
                    "Certificate holder",
                    `${result.registration.firstName} ${result.registration.lastName}`,
                  ],
                  ["Event", result.event.title],
                  [
                    "Event dates",
                    formatRange(result.event.startsAt, result.event.endsAt),
                  ],
                  ["Location", `${result.event.city}, ${result.event.country}`],
                  [
                    "Issued",
                    formatDate(result.certificate.issuedAt, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }),
                  ],
                  [
                    "Verification code",
                    result.certificate.verificationCode,
                  ],
                ].map(([term, value]) => (
                  <div
                    key={String(term)}
                    className="border-t border-[rgba(22,19,17,0.1)] py-4 sm:border-r sm:pr-8 sm:pl-0 sm:nth-[2n]:border-r-0 sm:nth-[2n]:pl-8"
                  >
                    <dt className="text-[0.715rem] font-semibold tracking-[0.14em] text-warm-400 uppercase">
                      {term}
                    </dt>
                    <dd className="tnum mt-2 text-[1.015rem] leading-snug font-semibold text-ink">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-9 flex items-start gap-4 rounded-[13px] border border-[rgba(47,107,79,0.24)] bg-[rgba(47,107,79,0.08)] p-6">
                <ShieldCheck
                  size={21}
                  className="mt-0.5 shrink-0 text-[var(--color-signal-green)]"
                />
                <div>
                  <h2 className="text-[1.015rem] leading-snug font-semibold text-ink">
                    What this page confirms
                  </h2>
                  <p className="mt-2 text-[0.875rem] leading-[1.75] text-warm-600">
                    It confirms that a certificate with this verification code
                    exists in the issuing organisation&apos;s records, together
                    with the event it relates to. It deliberately shows only the
                    minimum information needed for verification — no contact
                    details, payment information or personal records are
                    exposed.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/e/${result.event.slug}`}
                  className="btn btn-primary"
                >
                  View the event
                </Link>
                <Link href="/" className="btn btn-ghost">
                  Verify another certificate
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden px-8 py-14 text-center sm:px-12">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(22,19,17,0.12)] bg-[rgba(22,19,17,0.05)]">
              <SearchX size={28} className="text-warm-400" />
            </span>

            <h1 className="font-display mt-6 text-[clamp(1.85rem,4vw,2.45rem)] leading-[1.12] font-semibold text-ink">
              We couldn&apos;t find that certificate.
            </h1>

            <div className="mx-auto mt-5 flex max-w-[32rem] items-start gap-3 rounded-[12px] border border-[rgba(22,19,17,0.11)] bg-[rgba(22,19,17,0.035)] p-5 text-left">
              <CalendarDays
                size={19}
                className="mt-0.5 shrink-0 text-warm-400"
              />
              <div>
                <div className="eyebrow text-[0.565rem] text-warm-400">
                  Code searched
                </div>
                <div className="tnum mt-2 text-[1.015rem] font-semibold break-all text-ink">
                  {decodeURIComponent(code)}
                </div>
              </div>
            </div>

            <p className="mx-auto mt-6 max-w-[34rem] text-[0.985rem] leading-[1.78] text-warm-600">
              Verification codes are case-sensitive and look like{" "}
              <strong className="font-semibold text-ink">
                GF-KLS27-10432
              </strong>
              . If the code was typed manually, check for missing characters.
              Certificates that have been revoked or expired will also return
              this result.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href="/verify/GF-KLS27-10432"
                className="btn btn-primary"
              >
                Try the example certificate
              </Link>
              <Link href="/" className="btn btn-ghost">
                <ArrowLeft size={16} /> Back to Selah
              </Link>
            </div>

            <div className="mt-10 flex items-center justify-center gap-2.5 text-[0.8125rem] text-warm-400">
              <MapPin size={14} /> Need help? Contact the issuing organisation
              directly.
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[rgba(22,19,17,0.09)] bg-paper py-8">
        <div className="mx-auto flex w-full max-w-[900px] flex-col items-center justify-between gap-4 px-5 text-center sm:flex-row sm:px-8 sm:text-left">
          <div className="flex items-center gap-2.5 text-[0.795rem] text-warm-400">
            <CheckCircle2 size={15} className="text-[var(--color-signal-green)]" />
            Verification is read-only and reveals no personal information.
          </div>
          <Link
            href="/"
            className="eyebrow text-[0.585rem] text-[var(--color-brass-deep)]"
          >
            Powered by Selah
          </Link>
        </div>
      </footer>
    </div>
  );
}
