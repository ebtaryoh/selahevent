import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, Flame } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DailySelahMeditation } from "@/components/daily-selah-meditation";
import { PrayerWall } from "@/components/prayer-wall";
import { DailyFellowshipsFeed } from "@/components/daily-fellowships-feed";
import { LockscreenWallpaperCard } from "@/components/lockscreen-wallpaper-card";
import { MinistryChannelsFeed } from "@/components/ministry-channels-feed";

export const metadata: Metadata = {
  title: "Daily Sanctuary & Community Prayer Wall · Selah",
  description:
    "A daily digital sanctuary for believers worldwide. 60-second scripture reflections, live kingdom prayer altars, soaking audio player, and intercessory prayer wall.",
};

export default function SanctuaryPage() {
  return (
    <div className="min-h-screen bg-parchment text-ink flex flex-col justify-between">
      <SiteHeader />

      <main className="pt-28 pb-20 px-5 sm:px-8">
        <div className="mx-auto max-w-[1140px] space-y-12">
          {/* Hero Header */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brass/15 px-3 py-1 text-xs font-semibold text-brass border border-brass/30">
              <Sparkles size={13} />
              Selah Daily Sanctuary
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-ink">
              Pause. Breathe. Pray.
            </h1>
            <p className="text-sm sm:text-base text-warm-600 leading-relaxed">
              Every day, God calls us to pause from worldly noise. Meditate on today&apos;s scripture, listen to peaceful soaking worship, join live prayer altars, and stand in agreement on the community prayer wall.
            </p>
          </div>

          {/* Feature 1: Lock-Screen Wallpaper Generator & Daily Confession */}
          <section aria-label="Lockscreen Scripture Wallpaper">
            <LockscreenWallpaperCard
              verse="Be still, and know that I am God: I will be exalted among the nations, I will be exalted in the earth."
              reference="Psalm 46:10"
              theme="Surrender & Undisturbed Peace"
            />
          </section>

          {/* Feature 2: Today's Scripture & 60-Second Selah Pause */}
          <section aria-label="Today's Selah Reflection">
            <DailySelahMeditation />
          </section>

          {/* Feature 3: Today Around You — Live Altars & Daily Fellowships */}
          <section aria-label="Today Around You Live Altars" className="pt-4">
            <DailyFellowshipsFeed />
          </section>

          {/* Feature 4: Ministry Channels — Follow Your Home Church */}
          <section aria-label="Ministry Channels" className="pt-4">
            <MinistryChannelsFeed />
          </section>

          {/* Feature 5: Community Prayer Wall & Praise Reports */}
          <section aria-label="Community Prayer Wall" className="pt-4">
            <PrayerWall />
          </section>

          {/* Section: Connection to Upcoming In-Person Gatherings */}
          <div className="rounded-2xl border border-[rgba(192,138,46,0.3)] bg-gradient-to-r from-cypress to-paper p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brass/20 px-2.5 py-0.5 text-[0.7rem] font-bold text-brass border border-brass/40 uppercase tracking-wider">
                <Flame size={12} />
                Corporate Gathering
              </div>
              <h3 className="font-display text-2xl font-semibold text-ink">
                Looking for In-Person Fellowship This Weekend?
              </h3>
              <p className="text-xs sm:text-sm text-warm-400 leading-relaxed">
                Nothing replaces gathering together in the presence of God. Discover upcoming youth rallies, retreats, worship nights, and conferences in your city.
              </p>
            </div>

            <Link
              href="/"
              className="btn btn-brass !py-3 !px-6 text-sm font-semibold cursor-pointer shrink-0 shadow-lg shadow-brass/20 flex items-center gap-2"
            >
              Discover Upcoming Events <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
