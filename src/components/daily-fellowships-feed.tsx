"use client";

import { useState } from "react";
import { Radio, MapPin, Calendar, Clock, ExternalLink, Plus, Filter, Users, Video, Volume2, Check } from "lucide-react";
import { cn } from "@/lib/format";

type AltarItem = {
  id: string;
  title: string;
  ministry: string;
  city: string;
  timeStr: string;
  format: "Mixlr Audio" | "Zoom Live" | "YouTube Stream" | "Physical Gathering";
  isLiveNow?: boolean;
  category: "morning" | "midday" | "evening" | "vigil";
  description: string;
  joinUrl: string;
  attendeesCount: number;
};

const SAMPLE_ALTARS: AltarItem[] = [
  {
    id: "altar-1",
    title: "Command Your Morning Altar (Word & Warfare)",
    ministry: "MFM Youth Fellowship",
    city: "Lagos",
    timeStr: "Daily · 6:00 AM – 6:45 AM WAT",
    format: "Mixlr Audio",
    isLiveNow: true,
    category: "morning",
    description: "Start the day breaking spiritual barriers, commanding the morning light, and decreeing blessings over your career and family.",
    joinUrl: "https://mixlr.com",
    attendeesCount: 1420,
  },
  {
    id: "altar-2",
    title: "Midday Intercession for Nations & Persecuted Church",
    ministry: "Global Intercessors Network",
    city: "Online",
    timeStr: "Monday – Friday · 12:00 PM – 12:30 PM",
    format: "Zoom Live",
    category: "midday",
    description: "A focused 30-minute corporate lunch hour prayer standing in the gap for mission fields, youth revival, and national peace.",
    joinUrl: "https://zoom.us",
    attendeesCount: 380,
  },
  {
    id: "altar-3",
    title: "Wednesday Believers' Bible Feast & Communion",
    ministry: "Grace & Glory Assembly",
    city: "Abuja",
    timeStr: "Wednesdays · 6:00 PM – 7:30 PM",
    format: "Physical Gathering",
    category: "evening",
    description: "Deep verse-by-verse scriptural exposition followed by holy communion and collective laying on of hands.",
    joinUrl: "https://google.com/maps",
    attendeesCount: 650,
  },
  {
    id: "altar-4",
    title: "Friday All-Night Campus Holy Ghost Vigil",
    ministry: "Come Alive Youth Programme",
    city: "Ibadan",
    timeStr: "Every 2nd & 4th Friday · 10:00 PM – 4:00 AM",
    format: "Physical Gathering",
    category: "vigil",
    description: "An electric night of non-stop praise, fervent tongues, prophetic ministrations, and supernatural encounters for youth.",
    joinUrl: "https://google.com/maps",
    attendeesCount: 2200,
  },
  {
    id: "altar-5",
    title: "London Diaspora Evening Watch & Prayer Altar",
    ministry: "Kingdom Ambassadors UK",
    city: "London",
    timeStr: "Daily · 9:00 PM – 9:45 PM GMT",
    format: "YouTube Stream",
    category: "evening",
    description: "Evening spiritual alignment, prophetic declarations, and family protection prayers before bedtime for diaspora believers.",
    joinUrl: "https://youtube.com",
    attendeesCount: 510,
  },
];

const CITIES = ["All Locations", "Lagos", "Abuja", "Ibadan", "London", "Online"];

export function DailyFellowshipsFeed() {
  const [selectedCity, setSelectedCity] = useState("All Locations");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [savedAltarIds, setSavedAltarIds] = useState<Set<string>>(new Set());

  const filteredAltars = SAMPLE_ALTARS.filter((a) => {
    const matchesCity = selectedCity === "All Locations" || a.city === selectedCity;
    const matchesCategory = selectedCategory === "all" || a.category === selectedCategory || (selectedCategory === "live" && a.isLiveNow);
    return matchesCity && matchesCategory;
  });

  const handleSaveToCalendar = (id: string, title: string) => {
    setSavedAltarIds((prev) => new Set(prev).add(id));
    // Create ICS calendar reminder
    const icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Selah Daily Altar//EN",
      "BEGIN:VEVENT",
      `SUMMARY:${title}`,
      `DESCRIPTION:Join this daily altar on Selah Sanctuary`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${title.slice(0, 20)}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-emerald-400 animate-pulse" />
            <h3 className="font-display text-xl sm:text-2xl font-semibold text-ink">
              Today Around You · Live Altars & Daily Fellowships
            </h3>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-warm-500 max-w-xl">
            Never walk alone. Discover ongoing morning watch calls, lunch-hour prayer chains, and midweek fellowship gatherings happening today.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400 shrink-0">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          Live Across {SAMPLE_ALTARS.length} Fellowships
        </span>
      </div>

      {/* City & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* City Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {CITIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCity(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer",
                selectedCity === c
                  ? "border-brass bg-brass text-black"
                  : "border-white/10 bg-white/[0.02] text-warm-500 hover:border-white/20 hover:text-ink"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Time Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "rounded-lg px-2.5 py-1 cursor-pointer transition-colors",
              selectedCategory === "all" ? "bg-white/15 text-ink font-semibold" : "text-warm-500 hover:text-warm-300"
            )}
          >
            All Times
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("live")}
            className={cn(
              "rounded-lg px-2.5 py-1 cursor-pointer transition-colors flex items-center gap-1",
              selectedCategory === "live" ? "bg-emerald-500/20 text-emerald-400 font-semibold" : "text-warm-500 hover:text-emerald-400"
            )}
          >
            🔴 Live
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("morning")}
            className={cn(
              "rounded-lg px-2.5 py-1 cursor-pointer transition-colors",
              selectedCategory === "morning" ? "bg-white/15 text-ink font-semibold" : "text-warm-500 hover:text-warm-300"
            )}
          >
            Morning (6 AM)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("evening")}
            className={cn(
              "rounded-lg px-2.5 py-1 cursor-pointer transition-colors",
              selectedCategory === "evening" ? "bg-white/15 text-ink font-semibold" : "text-warm-500 hover:text-warm-300"
            )}
          >
            Evening
          </button>
        </div>
      </div>

      {/* Altars Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredAltars.map((altar) => {
          const isSaved = savedAltarIds.has(altar.id);
          return (
            <div
              key={altar.id}
              className={cn(
                "rounded-2xl border p-5 flex flex-col justify-between transition-all relative overflow-hidden",
                altar.isLiveNow
                  ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-paper to-paper shadow-lg"
                  : "border-white/10 bg-paper hover:border-white/20"
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {altar.isLiveNow ? (
                      <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Live Now
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-semibold text-warm-400">
                        {altar.category.toUpperCase()}
                      </span>
                    )}

                    <span className="rounded-full bg-brass/10 px-2 py-0.5 text-[0.65rem] font-medium text-brass">
                      {altar.format}
                    </span>
                  </div>

                  <span className="text-[0.72rem] text-warm-500 flex items-center gap-1">
                    <MapPin size={11} className="text-brass" /> {altar.city}
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-ink text-sm sm:text-base leading-snug">
                    {altar.title}
                  </h4>
                  <div className="mt-0.5 text-xs text-brass font-medium">
                    {altar.ministry}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-warm-400">
                  <Clock size={13} className="text-brass-light shrink-0" />
                  <span>{altar.timeStr}</span>
                </div>

                <p className="text-xs text-warm-500 leading-relaxed line-clamp-2">
                  {altar.description}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between gap-3">
                <span className="text-[0.72rem] text-warm-500 flex items-center gap-1">
                  <Users size={12} className="text-warm-400" />
                  {altar.attendeesCount.toLocaleString()} believers
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveToCalendar(altar.id, altar.title)}
                    className={cn(
                      "btn !py-1.5 !px-2.5 !text-xs cursor-pointer transition-colors",
                      isSaved ? "bg-emerald-500/20 text-emerald-400" : "btn-ghost border border-white/10 hover:border-white/20"
                    )}
                    title="Add reminder to your phone calendar"
                  >
                    {isSaved ? (
                      <>
                        <Check size={12} /> Set
                      </>
                    ) : (
                      <>
                        <Calendar size={12} /> Remind
                      </>
                    )}
                  </button>

                  <a
                    href={altar.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-brass !py-1.5 !px-3.5 !text-xs font-semibold cursor-pointer shadow-sm shadow-brass/20 flex items-center gap-1"
                  >
                    Join Altar <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
