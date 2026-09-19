import Link from "next/link";
import { ArrowLeft, Compass, QrCode, SearchX } from "lucide-react";
import { SelahMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <header className="border-b border-[rgba(22,19,17,0.09)]">
        <div className="mx-auto flex w-full max-w-[1000px] items-center px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <SelahMark className="h-9 w-9" />
            <div>
              <div className="font-display text-[1.125rem] leading-none font-semibold text-ink">
                Selah
              </div>
              <div className="eyebrow mt-1 text-[0.515rem] text-warm-400">
                Christian Event Operating System
              </div>
            </div>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(22,19,17,0.12)] bg-[rgba(22,19,17,0.045)]">
          <SearchX size={28} className="text-warm-400" strokeWidth={1.6} />
        </span>

        <div className="eyebrow mt-8 text-[0.625rem] text-[var(--color-brass-deep)]">
          Error 404
        </div>

        <h1 className="font-display mt-5 max-w-[22ch] text-[clamp(2.25rem,6vw,3.85rem)] leading-[1.03] font-semibold tracking-[-0.024em] text-ink">
          This page isn&apos;t on the programme.
        </h1>

        <p className="mt-6 max-w-[36rem] text-[1.045rem] leading-[1.78] text-warm-600">
          The link may be out of date, or the event you&apos;re looking for is
          private and only visible to its organisers. Everything else is exactly
          where you left it.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            <ArrowLeft size={17} /> Back to home
          </Link>
          <Link
            href="/e/kingdom-leadership-summit-2027"
            className="btn btn-ghost"
          >
            <Compass size={17} /> See a live event page
          </Link>
          <Link
            href="/dashboard/events/22222222-2222-4222-8222-222222222222/command"
            className="btn btn-ghost"
          >
            <QrCode size={17} /> Open the Command Center
          </Link>
        </div>

        <div className="mt-16 h-px w-full max-w-[22rem] bg-[rgba(192,138,46,0.36)]" />

        <p className="mt-8 max-w-[30rem] text-[0.845rem] leading-[1.75] text-warm-400">
          If you believe this is a mistake — for example, a registration link
          that stopped working — the organising team can re-share it from the
          event&apos;s communication timeline.
        </p>
      </main>
    </div>
  );
}
