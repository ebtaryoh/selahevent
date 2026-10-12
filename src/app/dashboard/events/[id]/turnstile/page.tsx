import { notFound } from "next/navigation";
import { getEventById, getEventStats } from "@/lib/data";
import { TurnstileKiosk } from "@/components/turnstile-kiosk";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) return { title: "Turnstile Not Found" };
  return {
    title: `Turnstile Gate Kiosk: ${event.title} | Selah`,
  };
}

export default async function TurnstilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const stats = await getEventStats(event.id);

  // Fetch a confirmed registration specifically for this event
  const sampleReg = await db
    .select({
      ticketCode: registrations.ticketCode,
      firstName: registrations.firstName,
      lastName: registrations.lastName,
    })
    .from(registrations)
    .where(and(eq(registrations.eventId, event.id), eq(registrations.status, "confirmed")))
    .limit(1)
    .then((r) => r[0]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0d0c] overflow-y-auto">
      <TurnstileKiosk
        event={{
          id: event.id,
          title: event.title,
          slug: event.slug,
          city: event.city,
        }}
        initialStats={{
          checkedIn: stats.checkedIn,
          registered: stats.registered,
        }}
        sampleRealTicket={
          sampleReg
            ? {
                code: sampleReg.ticketCode,
                name: `${sampleReg.firstName} ${sampleReg.lastName}`,
              }
            : undefined
        }
      />
    </div>
  );
}
