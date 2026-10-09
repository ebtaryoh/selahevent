import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/data";
import { PublicScanner } from "@/components/public-scanner";

type Params = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function PublicScannerRoute({ params, searchParams }: Params) {
  const { slug } = await params;
  const { token } = await searchParams;
  
  if (!token || typeof token !== "string") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 text-red-500 p-6 rounded-xl border border-red-500/30 max-w-sm">
          <h2 className="text-xl font-bold mb-2">Invalid Scanner Link</h2>
          <p className="text-sm opacity-80">This scanner link is missing a security token. Please ask the organizer for a valid link.</p>
        </div>
      </div>
    );
  }

  const event = await getEventBySlug(slug);
  if (!event) notFound();

  return (
    <div 
      className="min-h-screen pt-12 pb-20 px-6 bg-[var(--color-parchment)]"
      style={event.brandColor ? {
        '--color-brass': event.brandColor,
        '--color-brass-deep': `color-mix(in srgb, ${event.brandColor}, black 20%)`,
        '--color-brass-light': `color-mix(in srgb, ${event.brandColor}, white 30%)`,
        '--color-brass-wash': `color-mix(in srgb, ${event.brandColor}, white 85%)`,
      } as React.CSSProperties : undefined}
    >
      <div className="container mx-auto max-w-xl">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-ink">{event.title}</h1>
          <p className="text-warm-500 mt-2">Volunteer Check-in Scanner</p>
        </div>
        
        <PublicScanner eventId={event.id} magicToken={token} />
      </div>
    </div>
  );
}
