"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Search, MapPin, Loader2, Target, ChevronDown } from "lucide-react";
import clsx from "clsx";

const CATEGORIES = ["All", "Conferences", "Worship", "Business", "Youth Meetings", "Singles Program", "Christian Hangout", "Married & Singles", "Retreats", "Seminars", "Concerts", "Bible Study", "Online"];

export function EventSearch({ defaultGeoCity }: { defaultGeoCity?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [city, setCity] = useState(searchParams.get("city") ?? defaultGeoCity ?? "");
  const [category, setCategory] = useState(searchParams.get("category") || "");

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (query) params.set("query", query);
      else params.delete("query");

      if (city) params.set("city", city);
      else params.delete("city");

      if (category) params.set("category", category);
      else params.delete("category");

      const newUrl = `/?${params.toString()}#events`;
      
      if (searchParams.toString() !== params.toString()) {
        startTransition(() => {
          router.push(newUrl, { scroll: false });
        });
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query, city, category, router, searchParams]);

  const hardcodedCities = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Ogun"];
  const cities = [...hardcodedCities];
  if (defaultGeoCity && !hardcodedCities.includes(defaultGeoCity)) {
    cities.push(defaultGeoCity);
  }

  return (
    <div className="w-full space-y-6">
      {/* Category Pills */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map(c => {
          const isActive = (category === c.toLowerCase() || (c === "All" && !category));
          return (
            <button 
              key={c}
              onClick={() => setCategory(c === "All" ? "" : c.toLowerCase())}
              className={clsx(
                "whitespace-nowrap rounded-full px-5 py-2 text-[0.9rem] font-medium transition-colors",
                isActive
                  ? "bg-brass text-[#08080a]"
                  : "bg-white/5 text-white/80 hover:bg-white/10"
              )}
            >
              {c}
            </button>
          )
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2.5 text-[0.9rem] font-medium text-white/90 hover:bg-white/10 transition-colors">
          <Target size={16} className="text-white/60" /> Near me
        </button>
        
        {/* City Select */}
        <div className="relative flex items-center rounded-full bg-white/5 px-4 py-2.5 transition-colors focus-within:ring-1 focus-within:ring-brass hover:bg-white/10">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full appearance-none bg-transparent pr-5 text-[0.9rem] font-medium text-white/90 focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-[#101012] text-white">Pick a city</option>
            {cities.map((c) => (
              <option key={c} value={c} className="bg-[#101012] text-white">{c}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3">
            <ChevronDown size={14} className="text-white/50" />
          </div>
        </div>

        {/* Date Select (Visual Only) */}
        <div className="relative flex items-center rounded-full bg-white/5 px-4 py-2.5 transition-colors hover:bg-white/10">
           <select className="w-full appearance-none bg-transparent pr-5 text-[0.9rem] font-medium text-white/90 focus:outline-none cursor-pointer">
             <option className="bg-[#101012] text-white">Any time</option>
             <option className="bg-[#101012] text-white">This Weekend</option>
             <option className="bg-[#101012] text-white">This Month</option>
           </select>
           <div className="pointer-events-none absolute right-3">
            <ChevronDown size={14} className="text-white/50" />
          </div>
        </div>

        {/* Sort Select (Visual Only) */}
        <div className="relative flex items-center rounded-full bg-white/5 px-4 py-2.5 transition-colors hover:bg-white/10">
           <select className="w-full appearance-none bg-transparent pr-5 text-[0.9rem] font-medium text-white/90 focus:outline-none cursor-pointer">
             <option className="bg-[#101012] text-white">Soonest first</option>
             <option className="bg-[#101012] text-white">Newest added</option>
           </select>
           <div className="pointer-events-none absolute right-3">
            <ChevronDown size={14} className="text-white/50" />
          </div>
        </div>

        {/* Search Input */}
        <div className="relative ml-auto flex flex-1 min-w-[200px] max-w-[350px] items-center rounded-full bg-white/5 px-4 py-2.5 transition-colors focus-within:bg-white/10 focus-within:ring-1 focus-within:ring-brass">
          <Search size={16} className="text-white/50" />
          <input
            type="text"
            placeholder="Search events, ministries..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent px-3 text-[0.9rem] text-white placeholder:text-white/40 focus:outline-none"
          />
          {isPending && <Loader2 size={14} className="animate-spin text-brass" />}
        </div>
      </div>
    </div>
  );
}
