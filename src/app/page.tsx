import Image from "next/image";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Sparkles, Ticket, Globe, Shield, Star } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Reveal } from "@/components/ui";
import { getAllPublicEvents } from "@/lib/data";
import { EventSearch } from "@/components/event-search";
import { formatMoney } from "@/lib/format";
import { getOrgSession } from "@/lib/session";

type SearchParams = {
  query?: string;
  city?: string;
  category?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  
  // Read Vercel's IP geolocation headers
  const headersList = await headers();
  const geoCityHeader = headersList.get("x-vercel-ip-city");
  const geoCity = geoCityHeader ? decodeURIComponent(geoCityHeader) : undefined;
  
  // Default to geoCity if no city is specified in the URL params
  const activeCity = params.city ?? geoCity;
  const queryParams = { ...params, city: activeCity };

  const publicEvents = await getAllPublicEvents(queryParams);
  const session = await getOrgSession();

  return (
    <div className="min-h-screen bg-parchment selection:bg-brass selection:text-black">
      <SiteHeader isSignedIn={!!session} />

      {/* Hero Section */}
      <section className="relative isolate overflow-hidden pt-[140px] pb-32">
        <div className="absolute inset-0 -z-10 bg-parchment-deep">
          <Image
            src="/images/hero-auditorium.jpg"
            alt="A gathering in a warmly lit auditorium"
            className="object-cover object-[62%_center] opacity-30 mix-blend-luminosity"
            priority
            fill
            sizes="100vw"
          />
          {/* Deep radial gradient to fade out edges into the dark background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(8,8,10,0.3)_0%,rgba(8,8,10,1)_85%)]" />
          <div className="grain pointer-events-none absolute inset-0 opacity-[0.25]" />
        </div>

        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 text-center relative z-10">
          <Reveal>
            <div className="mx-auto mb-8 inline-flex items-center gap-2.5 rounded-full border border-brass/20 bg-brass/10 px-4 py-2 backdrop-blur-md">
              <Sparkles size={14} className="text-brass-light" />
              <span className="eyebrow text-[0.65rem] text-brass-light tracking-[0.15em] uppercase font-semibold">
                A New Standard for Gatherings
              </span>
            </div>
          </Reveal>
          
          <Reveal delay={0.1}>
            <h1 className="font-display mx-auto max-w-5xl text-[clamp(3.2rem,8vw,6.5rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-ink">
              Curated experiences for the <span className="italic font-light text-brass-light px-1">modern</span> church.
            </h1>
          </Reveal>
          
          <Reveal delay={0.2}>
            <p className="mx-auto mt-8 max-w-2xl text-[clamp(1.0625rem,1.7vw,1.35rem)] leading-[1.7] text-warm-500 font-light">
              Discover, register, and experience world-class spiritual events. Beautifully designed ticketing that puts the focus back on what matters.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
              <a href="#events" className="btn btn-brass !rounded-full !px-10 !py-4.5 !text-[1.05rem] shadow-[0_0_30px_rgba(226,192,115,0.25)] hover:shadow-[0_0_40px_rgba(226,192,115,0.45)] transition-all duration-300 hover:-translate-y-0.5">
                Explore The Collection
                <ArrowRight size={17} strokeWidth={2.1} className="ml-2" />
              </a>
              <Link href={session ? "/dashboard/events/new" : "/register"} className="btn btn-ghost !rounded-full !px-10 !py-4.5 !text-[1.05rem] border border-white/10 hover:bg-white/5 hover:border-white/20 backdrop-blur-md text-ink transition-all duration-300">
                Host an Event
              </Link>
            </div>
          </Reveal>
        </div>
        
        {/* Subtle Glow behind the hero text */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[rgba(226,192,115,0.08)] blur-[120px] rounded-full pointer-events-none -z-10" />
      </section>

      {/* Features Showcase */}
      <section className="relative z-20 -mt-16 mx-auto max-w-[1240px] px-5 sm:px-8 pb-32">
        <Reveal delay={0.4}>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Ticket,
                title: "Seamless Ticketing",
                desc: "One-click registration and instant QR delivery. No passwords required."
              },
              {
                icon: Globe,
                title: "Global Reach",
                desc: "Accept payments anywhere with Paystack and Stripe perfectly integrated."
              },
              {
                icon: Shield,
                title: "Bank-Grade Security",
                desc: "Your attendee data is encrypted and completely private to your ministry."
              }
            ].map((f, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(16,16,18,0.7)] backdrop-blur-xl p-8 hover:border-brass/30 transition-colors duration-500 shadow-2xl shadow-black/50">
                <div className="absolute inset-0 bg-gradient-to-br from-brass/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brass/10 text-brass border border-brass/20">
                    <f.icon size={22} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-[1.35rem] font-semibold text-ink mb-3">{f.title}</h3>
                  <p className="text-warm-500 leading-relaxed text-[0.95rem] font-light">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Events Grid Section */}
      <section id="events" className="relative pb-40">
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
          
          <Reveal>
             <div className="mb-20">
               <EventSearch defaultGeoCity={geoCity} />
             </div>
          </Reveal>

          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/10 pb-6 mb-14 gap-6">
              <div>
                <h2 className="font-display text-[2.5rem] leading-none font-semibold text-ink">The Collection</h2>
                <p className="mt-3 text-[1.1rem] text-warm-500 font-light">Handpicked upcoming events near you.</p>
              </div>
              <div className="flex">
                <span className="inline-flex items-center gap-2 rounded-full border border-brass/20 bg-brass/10 px-4 py-1.5 text-[0.8rem] text-brass uppercase tracking-widest font-semibold">
                  <Star size={14} className="text-brass" fill="currentColor" /> Featured
                </span>
              </div>
            </div>
          </Reveal>

          {publicEvents.length === 0 ? (
            <Reveal delay={0.2}>
              <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-[rgba(16,16,18,0.4)] py-24 text-center backdrop-blur-md">
                <CalendarDays size={48} className="text-white/20 mb-6" strokeWidth={1} />
                <h3 className="font-display text-2xl font-semibold text-ink">No events found</h3>
                <p className="mt-3 text-warm-500 max-w-sm font-light">We couldn't find any events matching your criteria right now. Check back later.</p>
              </div>
            </Reveal>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {publicEvents.map(({ event, organization, minPrice }, i) => (
                <Reveal key={event.id} delay={0.1 * i}>
                  <Link
                    href={`/e/${event.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(16,16,18,0.6)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] hover:border-brass/30"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-parchment-deep">
                      {event.coverImage && (
                        <Image
                          src={event.coverImage}
                          alt={event.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          style={{
                            objectPosition: (event.media as any[])?.[0]?.focus 
                              ? `${(event.media as any[])[0].focus.x}% ${(event.media as any[])[0].focus.y}%` 
                              : "center"
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-black/20 to-transparent opacity-90 transition-opacity duration-300" />
                      
                      {/* Floating Event Tag */}
                      <div className="absolute top-5 left-5 rounded-full bg-black/40 px-4 py-1.5 backdrop-blur-md border border-white/10">
                        <span className="text-[0.65rem] font-bold text-brass tracking-widest uppercase">
                          {event.eventType}
                        </span>
                      </div>
                      
                      {/* Price Tag Overlay */}
                      <div className="absolute top-5 right-5 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md border border-white/10">
                        <span className="text-[0.7rem] font-semibold text-ink">
                          {minPrice === 0 ? "Free" : `From ${formatMoney(minPrice, event.currency)}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col px-7 pb-8 pt-6 relative -mt-12 z-10">
                      <div className="mb-3 text-[0.7rem] font-semibold text-brass uppercase tracking-widest">
                        {organization.name}
                      </div>
                      
                      <h3 className="font-display mb-4 text-[1.5rem] leading-[1.2] font-semibold text-ink transition-colors duration-300 group-hover:text-brass-light">
                        {event.title}
                      </h3>
                      
                      <p className="mb-8 line-clamp-2 text-[0.95rem] leading-[1.6] text-warm-500 font-light">
                        {event.tagline || event.description}
                      </p>

                      <div className="mt-auto space-y-3.5 border-t border-white/10 pt-6 text-[0.85rem] text-warm-400 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-brass">
                            <CalendarDays size={14} />
                          </div>
                          <span>
                            {new Intl.DateTimeFormat("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }).format(new Date(event.startsAt))}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-brass">
                            <MapPin size={14} />
                          </div>
                          <span className="truncate">
                            {event.venueName}, {event.city}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
