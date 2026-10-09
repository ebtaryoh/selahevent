import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { 
  ArrowRight, 
  Building2, 
  Users, 
  QrCode, 
  Shield, 
  Sparkles, 
  BarChart3,
  CalendarDays
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal, SectionHead } from "@/components/ui";
import { getOrgSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Selah for Ministries | The Christian Event Operating System",
  description: "Stop using generic event tools. Run your next church conference, retreat, or summit on an operating system built for ministry.",
};

export default async function ForMinistriesPage() {
  const session = await getOrgSession();

  return (
    <div className="min-h-screen bg-parchment selection:bg-brass selection:text-black">
      <SiteHeader isSignedIn={!!session} />

      <main id="main-content">
        {/* ------------- Hero Section ------------- */}
        <section className="relative isolate overflow-hidden pt-[140px] pb-32">
          <div className="absolute inset-0 -z-10 bg-parchment-deep">
            {/* Dark gradient background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,42,34,0.15)_0%,rgba(8,8,10,1)_85%)]" />
            <div className="grain pointer-events-none absolute inset-0 opacity-[0.25]" />
            
            {/* Glowing Orbs */}
            <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-brass/10 blur-[120px] rounded-full animate-float mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] bg-cypress/20 blur-[100px] rounded-full animate-float mix-blend-screen pointer-events-none" style={{ animationDelay: "2s" }} />
          </div>

          <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 relative z-10 text-center">
            <Reveal>
              <div className="mx-auto mb-8 inline-flex items-center gap-2.5 rounded-full border border-brass/20 bg-brass/10 px-4 py-2 backdrop-blur-md">
                <Building2 size={14} className="text-brass-light" />
                <span className="eyebrow text-[0.65rem] text-brass-light tracking-[0.15em] uppercase font-semibold">
                  Built exclusively for Ministries
                </span>
              </div>
            </Reveal>
            
            <Reveal delay={0.1}>
              <h1 className="font-display mx-auto max-w-4xl text-[clamp(2.8rem,6vw,5.5rem)] leading-[1.05] font-semibold tracking-[-0.02em] text-ink">
                Run your next convention without the chaos.
              </h1>
            </Reveal>
            
            <Reveal delay={0.2}>
              <p className="mx-auto mt-8 max-w-2xl text-[clamp(1.05rem,1.5vw,1.25rem)] leading-[1.7] text-warm-500 font-light">
                Generic event platforms weren't built for church logistics. Selah brings your ticketing, check-ins, volunteers, and reporting into one beautiful, unified command center.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
                <Link href="/register" className="btn btn-brass !rounded-full !px-10 !py-4.5 !text-[1.05rem] shadow-[0_0_30px_rgba(226,192,115,0.25)] hover:shadow-[0_0_40px_rgba(226,192,115,0.45)] transition-all duration-300 hover:-translate-y-0.5">
                  Start your Organization
                  <ArrowRight size={17} strokeWidth={2.1} className="ml-2" />
                </Link>
                <a href="#features" className="btn btn-ghost !rounded-full !px-10 !py-4.5 !text-[1.05rem] border border-white/10 hover:bg-white/5 hover:border-white/20 backdrop-blur-md text-ink transition-all duration-300">
                  See how it works
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ------------- The Problem/Solution Section ------------- */}
        <section id="features" className="bg-parchment py-24 sm:py-32 border-t border-[rgba(22,19,17,0.05)]">
          <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
            <Reveal>
              <SectionHead
                index="01"
                eyebrow="The Ministry Toolkit"
                title={<>Everything you need for a seamless gathering.</>}
                description="We looked at how mega-churches and ministries actually run their events, and built the exact tools they were missing."
              />
            </Reveal>

            <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: QrCode,
                  title: "Lightning Fast Check-in",
                  desc: "Scan QR codes in milliseconds. Keep the queue moving even when 5,000 people show up at once."
                },
                {
                  icon: Users,
                  title: "Volunteer Management",
                  desc: "Assign roles, manage shifts, and confirm attendance for your ushers, protocol, and media teams."
                },
                {
                  icon: Sparkles,
                  title: "Event Blueprints",
                  desc: "Never start from scratch. Save your annual convention as a blueprint and recreate it next year in one click."
                },
                {
                  icon: Shield,
                  title: "Secure & Private",
                  desc: "Your congregation's data belongs to you. No spam, no selling data, just bank-grade security."
                },
                {
                  icon: BarChart3,
                  title: "Real-time Command Center",
                  desc: "Watch registrations, revenue, and live check-ins happen in real-time from your dashboard."
                },
                {
                  icon: CalendarDays,
                  title: "Multi-Day Schedules",
                  desc: "Build complex itineraries with multiple tracks, breakout sessions, and speaker profiles seamlessly."
                }
              ].map((feature, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <div className="group h-full rounded-[24px] border border-[rgba(22,19,17,0.1)] bg-paper p-8 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(14,42,34,0.1)] hover:border-[var(--color-brass-deep)]">
                    <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(22,19,17,0.05)] text-[var(--color-brass-deep)] transition-transform duration-500 group-hover:scale-110 group-hover:bg-[var(--color-brass-deep)] group-hover:text-parchment">
                      <feature.icon size={26} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-display text-[1.35rem] font-semibold text-ink mb-3">{feature.title}</h3>
                    <p className="text-warm-500 leading-relaxed text-[0.95rem]">{feature.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ------------- Mission Statement ------------- */}
        <section className="relative overflow-hidden bg-[#0a0a0c] py-24 sm:py-32">
          <div className="absolute inset-0 opacity-10 bg-[url('/images/noise.png')] mix-blend-overlay pointer-events-none" />
          
          <div className="relative z-10 mx-auto max-w-[1180px] px-5 sm:px-8">
            <Reveal>
              <div className="mx-auto max-w-4xl text-center">
                <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] leading-[1.2] font-semibold text-[var(--color-brass-light)]">
                  "Our vision is to equip every ministry with the technology they need to host life-changing gatherings, without the administrative chaos."
                </h2>
                <div className="mt-10 flex flex-col items-center justify-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-[var(--color-brass-deep)]">
                    <div className="h-full w-full bg-[rgba(232,211,166,0.1)] flex items-center justify-center text-[var(--color-brass-light)] font-display font-semibold text-xl">
                      S
                    </div>
                  </div>
                  <div>
                    <div className="text-[1.05rem] font-semibold text-white">The Selah Team</div>
                    <div className="text-[0.85rem] text-[var(--color-brass-light)] mt-1 opacity-70">Building for the Kingdom</div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ------------- Final CTA ------------- */}
        <section className="relative isolate overflow-hidden py-32 bg-parchment">
          <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 text-center relative z-10">
            <Reveal>
              <h2 className="font-display mx-auto max-w-3xl text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] font-semibold text-ink">
                Ready to upgrade your next gathering?
              </h2>
            </Reveal>
            
            <Reveal delay={0.1}>
              <p className="mx-auto mt-6 max-w-2xl text-[1.15rem] leading-[1.7] text-warm-500 font-light">
                Join the ministries already using Selah to deliver seamless, world-class event experiences.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/register" className="btn btn-brass !rounded-full !px-10 !py-4.5 !text-[1.05rem]">
                  Create Free Account
                </Link>
                <a href="mailto:sales@selahevent.com" className="btn btn-light !rounded-full !px-10 !py-4.5 !text-[1.05rem]">
                  Contact Sales
                </a>
              </div>
              <p className="mt-6 text-[0.85rem] text-warm-400">
                No credit card required. Setup takes 2 minutes.
              </p>
            </Reveal>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
