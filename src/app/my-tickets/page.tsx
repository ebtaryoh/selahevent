import { Metadata } from "next";
import { TicketLookupForm } from "@/components/ticket-lookup-form";
import { SelahMark } from "@/components/logo";

export const metadata: Metadata = {
  title: "My Tickets | Selah",
  description: "Find your event tickets on Selah.",
};

export default function MyTicketsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdf8f4] p-4 text-[#161311]">
      <div className="absolute top-8 left-8">
        <SelahMark />
      </div>
      <div className="w-full max-w-md space-y-8 rounded-[24px] bg-white p-10 shadow-sm border border-[rgba(22,19,17,0.1)]">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Find your tickets</h1>
          <p className="mt-3 text-[0.95rem] text-[#867c74]">
            Enter the email address you used to register. We'll send you a link to access your tickets.
          </p>
        </div>

        <TicketLookupForm />
      </div>
    </div>
  );
}
