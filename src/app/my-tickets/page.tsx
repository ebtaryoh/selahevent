import { Metadata } from "next";
import { TicketLookupForm } from "@/components/ticket-lookup-form";
import { SelahMark } from "@/components/logo";

export const metadata: Metadata = {
  title: "My Tickets | Selah",
  description: "Find your event tickets on Selah.",
};

export default function MyTicketsPage() {
  return (
    <div className="grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-parchment p-5 text-ink sm:p-8">
      <div className="absolute left-6 top-6 sm:left-10 sm:top-10">
        <SelahMark />
      </div>
      <main className="card relative w-full max-w-md p-7 sm:p-10">
        <div className="mb-8 text-center">
          <p className="eyebrow text-brass-deep">Your Selah pass</p>
          <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight">Find your tickets</h1>
          <p className="mt-3 text-[0.95rem] leading-7 text-warm-600">
            Enter the email address you used to register. We&apos;ll send you a link to access your tickets.
          </p>
        </div>
        <TicketLookupForm />
      </main>
    </div>
  );
}
