import { notFound } from "next/navigation";
import { getEventBySlug, getTickets } from "@/lib/data";
import { RegistrationForm } from "@/components/registration-form";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  
  if (!event) return { title: "Not found" };
  
  return {
    title: `Register for ${event.title}`,
  };
}

export default async function RegisterPage({ params }: Params) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  
  if (!event) {
    notFound();
  }

  const rawTickets = await getTickets(event.id);
  
  // Transform to match the expected TicketOption type
  const tickets = rawTickets.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description || "",
    price: t.price,
    currency: event.currency,
    badge: t.badge,
    benefits: t.benefits,
    remaining: t.capacity - t.sold,
  }));

  return (
    <div className="min-h-screen bg-[var(--color-parchment)] pt-20 pb-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <RegistrationForm 
          event={{
            title: event.title,
            slug: event.slug,
            city: event.city,
            venueName: event.venueName,
            venueAddress: event.venueAddress,
            startsAt: event.startsAt?.toISOString() || new Date().toISOString(),
            endsAt: event.endsAt?.toISOString() || new Date().toISOString(),
            customQuestions: event.customQuestions,
          }}
          tickets={tickets} 
        />
      </div>
    </div>
  );
}
