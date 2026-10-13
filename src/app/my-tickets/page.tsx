import { Metadata } from "next";
import { TicketLookupForm } from "@/components/ticket-lookup-form";
import { SelahMark } from "@/components/logo";
import Link from "next/link";
import { ArrowLeft, Ticket } from "lucide-react";

export const metadata: Metadata = {
  title: "Find My Pass | Selah",
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-cypress p-4 sm:p-6 text-white relative">
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <SelahMark />
        </Link>
      </div>

      <div className="w-full max-w-xl rounded-3xl bg-black/40 p-6 sm:p-10 shadow-2xl border border-white/10 backdrop-blur-md">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brass/10 border border-brass/25 text-brass mb-4">
            <Ticket size={28} />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
            Find Your Pass
          </h1>
          <p className="mt-2 text-sm text-white/70 max-w-md mx-auto leading-relaxed">
            Lost your pass, deleted your email, or need your QR code for the gate?
            Enter your email or phone number to retrieve your pass instantly.
          </p>
        </div>

        <TicketLookupForm eventSlug={eventSlug} />

        <div className="mt-8 border-t border-white/10 pt-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={13} /> Return to Selah Home
          </Link>
        </div>
      </div>
    </div>
  );
}
