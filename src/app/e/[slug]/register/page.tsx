import { notFound } from "next/navigation";
import { getEventBySlug, getTickets } from "@/lib/data";
import { getOrgSession } from "@/lib/session";
import { RegistrationForm } from "@/components/registration-form";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = { 
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  
  if (!event) return { title: "Not found" };
  
  return {
    title: `Register for ${event.title}`,
  };
}

export default async function RegisterPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  
  if (!event) {
    notFound();
  }

  const session = await getOrgSession();
  const isStaff = Boolean(session && session.orgId === event.organizationId);

  const search = await searchParams;
  const initialTicketId = typeof search.ticket === 'string' ? search.ticket : undefined;

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
    isDonation: t.isDonation,
  }));

  const isCancelled = event.status === "cancelled";
  const isPostponed = event.status === "postponed";

  const isRegistrationUpcoming =
    !isCancelled && !isPostponed && event.registrationOpensAt && new Date(event.registrationOpensAt) > new Date();

  const isRegistrationClosed =
    isCancelled ||
    isPostponed ||
    (event.registrationClosesAt && new Date(event.registrationClosesAt) < new Date()) ||
    new Date(event.endsAt) < new Date();

  const isEmbed = search?.embed === "true";

  return (
    <div 
      className={cn(
        "min-h-screen bg-[var(--color-parchment)]",
        isEmbed ? "pt-6 pb-10" : "pt-20 pb-20"
      )}
      style={event.brandColor ? {
        '--color-brass': event.brandColor,
        '--color-brass-deep': `color-mix(in srgb, ${event.brandColor}, black 20%)`,
        '--color-brass-light': `color-mix(in srgb, ${event.brandColor}, white 30%)`,
        '--color-brass-wash': `color-mix(in srgb, ${event.brandColor}, white 85%)`,
      } as React.CSSProperties : undefined}
    >
      <div className="container mx-auto px-6 max-w-6xl">
        {isCancelled ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-500/20 bg-paper p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
              <span className="text-xl">⚠️</span>
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink">This event has been cancelled</h1>
            <p className="mt-4 text-warm-600 text-sm leading-relaxed">
              {event.cancellationReason || "Registration is not available because this event has been cancelled by the organizers."}
            </p>
            <div className="mt-8">
              <a href={`/e/${event.slug}`} className="btn btn-primary">
                Return to event page
              </a>
            </div>
          </div>
        ) : isPostponed ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-amber-500/20 bg-paper p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 mb-4">
              <span className="text-xl">⏳</span>
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink">This event has been postponed</h1>
            <p className="mt-4 text-warm-600 text-sm leading-relaxed">
              {event.cancellationReason || "Registration is temporarily paused while new dates are scheduled by the organizers."}
            </p>
            <div className="mt-8">
              <a href={`/e/${event.slug}`} className="btn btn-primary">
                Return to event page
              </a>
            </div>
          </div>
        ) : isRegistrationClosed && !isStaff ? (
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
        ) : isRegistrationUpcoming && !isStaff ? (
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
          <>
            {isRegistrationClosed && isStaff && !isCancelled && (
              <div className="mx-auto max-w-[52rem] mb-6 rounded-xl border border-[rgba(184,121,28,0.35)] bg-[rgba(184,121,28,0.1)] p-4 text-sm text-[#7d5212] flex items-center gap-3">
                <span className="font-semibold">⚠️ Desk Mode:</span>
                <span>Public online registration has closed, but your organizer session is active to register door walk-ins.</span>
              </div>
            )}

            {/* Self-Service 'Find My Lost Pass' Banner */}
            <div className="mx-auto max-w-[52rem] mb-6 rounded-2xl border border-brass/30 bg-black/40 p-4 sm:px-5 text-xs text-white/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brass/20 text-brass text-sm shrink-0">
                  🎟️
                </span>
                <div>
                  <span className="font-semibold text-white block">Already registered for this event?</span>
                  <span className="text-white/60 text-[0.725rem]">Lost your ticket email, closed your browser, or need your QR code for the gate?</span>
                </div>
              </div>
              <a
                href={`/my-tickets?event=${event.slug}`}
                className="shrink-0 btn btn-secondary !text-xs !py-2 !px-3.5 !border-brass/40 !text-brass-light hover:!bg-brass/20 inline-flex items-center gap-1 font-semibold"
              >
                Find &amp; Retrieve Pass &rarr;
              </a>
            </div>

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
                attendeeTypes: event.attendeeTypes,
                accommodationMode: (event.accommodationMode as "none" | "free" | "paid" | "both") || "none",
                collectGender: Boolean(event.collectGender),
                collectAgeBracket: Boolean(event.collectAgeBracket),
                collectOccupation: Boolean(event.collectOccupation),
              }}
              tickets={tickets}
              initialTicketId={initialTicketId}
              isStaff={isStaff}
            />
          </>
        )}
      </div>
    </div>
  );
}
