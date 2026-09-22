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
    capacity: t.capacity,
    remaining: t.capacity - t.sold,
  }));

  const isRegistrationUpcoming =
    event.registrationOpensAt && new Date(event.registrationOpensAt) > new Date();

  const isRegistrationClosed =
    (event.registrationClosesAt && new Date(event.registrationClosesAt) < new Date()) ||
    new Date(event.endsAt) < new Date();

  return (
    <div 
      className="min-h-screen bg-[var(--color-parchment)] pt-20 pb-20"
      style={event.brandColor ? {
        '--color-brass': event.brandColor,
        '--color-brass-deep': `color-mix(in srgb, ${event.brandColor}, black 20%)`,
        '--color-brass-light': `color-mix(in srgb, ${event.brandColor}, white 30%)`,
        '--color-brass-wash': `color-mix(in srgb, ${event.brandColor}, white 85%)`,
      } as React.CSSProperties : undefined}
    >
      <div className="container mx-auto px-6 max-w-6xl">
        {isRegistrationClosed ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-[rgba(22,19,17,0.1)] bg-paper p-10 text-center shadow-sm">
            <h1 className="font-display text-2xl font-semibold text-ink">Registration is closed</h1>
            <p className="mt-4 text-warm-600">
              Sorry, registration for this event has closed.
            </p>
            <div className="mt-8">
              <a href={`/e/${event.slug}`} className="btn btn-primary">
                Return to event page
              </a>
            </div>
          </div>
        ) : isRegistrationUpcoming ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-[rgba(22,19,17,0.1)] bg-paper p-10 text-center shadow-sm">
            <h1 className="font-display text-2xl font-semibold text-ink">Registration opens soon</h1>
            <p className="mt-4 text-warm-600">
              Registration for this event will open on {new Date(event.registrationOpensAt!).toLocaleDateString()}.
            </p>
            <div className="mt-8">
              <a href={`/e/${event.slug}`} className="btn btn-primary">
                Return to event page
              </a>
            </div>
          </div>
        ) : (
          <RegistrationForm 
            event={{
              title: event.title,
              slug: event.slug,
              orgId: event.organizationId,
              city: event.city,
              venueName: event.venueName,
              venueAddress: event.venueAddress,
              startsAt: event.startsAt?.toISOString() || new Date().toISOString(),
              endsAt: event.endsAt?.toISOString() || new Date().toISOString(),
              coverImage: event.coverImage,
              customQuestions: event.customQuestions,
            }}
            tickets={tickets} 
          />
        )}
      </div>
    </div>
  );
}
