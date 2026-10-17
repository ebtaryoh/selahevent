import { Metadata } from "next";
import { TicketLookupForm } from "@/components/ticket-lookup-form";
import { SelahMark } from "@/components/logo";
import Link from "next/link";
import { ArrowLeft, Ticket, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Find My Pass · Selah Sanctuary Gate",
  description: "Retrieve your digital ticket pass, table seating, and QR entry badge on Selah.",
};

export default async function MyTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const eventSlug = typeof params.event === "string" ? params.event : typeof params.slug === "string" ? params.slug : undefined;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-parchment p-4 sm:p-8 text-ink overflow-hidden selection:bg-brass selection:text-black">
      {/* Background Celestial Glowing Orbs */}
      <div className="absolute top-[10%] left-[15%] w-[320px] h-[320px] bg-brass/15 blur-[120px] rounded-full animate-celestial pointer-events-none" />
      <div className="absolute bottom-[10%] right-[15%] w-[380px] h-[380px] bg-amber-500/10 blur-[130px] rounded-full animate-celestial-reverse pointer-events-none" />
      <div className="grain pointer-events-none absolute inset-0 opacity-20" />

      {/* Top Header Bar */}
      <header className="absolute top-6 inset-x-6 flex items-center justify-between max-w-4xl mx-auto z-20">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <SelahMark />
          <span className="font-display text-lg font-semibold tracking-tight text-ink hidden sm:inline">
            Selah
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Ticket Pass Card */}
      <main className="w-full max-w-xl rounded-3xl bg-[var(--card-bg)] p-7 sm:p-11 shadow-2xl border border-[var(--card-border)] backdrop-blur-2xl relative z-10 transition-all duration-300">
        <div className="text-center mb-8">
          {/* Sacred Scripture Banner */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brass/30 bg-brass/10 px-3.5 py-1 text-[0.68rem] font-bold text-brass uppercase tracking-widest mb-5">
            <Sparkles size={12} className="text-brass-light" />
            <span>Gate &amp; Assembly Check-In</span>
          </div>

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brass/15 border border-brass/35 text-brass mb-4 shadow-[0_0_25px_rgba(226,192,115,0.25)]">
            <Ticket size={30} />
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
            Find Your Pass
          </h1>

          <p className="mt-2.5 text-sm sm:text-[0.925rem] text-warm-500 max-w-md mx-auto leading-relaxed">
            Lost your pass, deleted your email, or need your QR entry code for the gate?
            Enter your email or phone number to retrieve your pass instantly.
          </p>

          {/* Contextual Scripture Verse */}
          <p className="mt-4 font-display text-xs italic text-brass-deep/90 max-w-md mx-auto">
            &ldquo;Enter into His gates with thanksgiving, and into His courts with praise.&rdquo; — Psalm 100:4
          </p>
        </div>

        <TicketLookupForm eventSlug={eventSlug} />

        <div className="mt-8 border-t border-[var(--card-border)] pt-5 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-warm-500 hover:text-brass transition-colors"
          >
            <ArrowLeft size={14} /> Return to Selah Home
          </Link>
        </div>
      </main>

      <footer className="mt-8 text-center text-xs text-warm-400 relative z-10">
        <p>Selah Event Systems · Holy Gatherings Done Decently and in Order</p>
      </footer>
    </div>
  );
}
