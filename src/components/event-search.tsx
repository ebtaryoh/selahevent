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
  const [city, setCity] = useState(searchParams.get("city") || "");
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
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((c) => {
          const isActive = category === c.toLowerCase() || (c === "All" && !category);
          return (
            <button
              key={c}
              onClick={() => setCategory(c === "All" ? "" : c.toLowerCase())}
              className={clsx(
                "whitespace-nowrap rounded-full px-5 py-2 text-[0.875rem] font-semibold transition-all duration-200 cursor-pointer shadow-sm",
                isActive
                  ? "bg-brass text-parchment-deep shadow-md font-bold"
                  : "bg-[var(--card-bg)] text-warm-500 border border-[var(--card-border)] hover:border-brass/50 hover:text-ink"
              )}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* City Select */}
        <div className="relative flex items-center rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] px-4 py-2.5 transition-colors focus-within:ring-2 focus-within:ring-brass/40 hover:border-brass/40 shadow-sm">
          <MapPin size={15} className="text-brass mr-2 shrink-0" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full appearance-none bg-transparent pr-6 text-[0.875rem] font-medium text-ink focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-[var(--color-parchment)] text-ink">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c} className="bg-[var(--color-parchment)] text-ink">{c}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3">
            <ChevronDown size={14} className="text-warm-400" />
          </div>
        </div>

        {/* Date Select */}
        <div className="relative flex items-center rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] px-4 py-2.5 transition-colors hover:border-brass/40 shadow-sm">
          <select className="w-full appearance-none bg-transparent pr-6 text-[0.875rem] font-medium text-ink focus:outline-none cursor-pointer">
            <option className="bg-[var(--color-parchment)] text-ink">Any Time</option>
            <option className="bg-[var(--color-parchment)] text-ink">This Weekend</option>
            <option className="bg-[var(--color-parchment)] text-ink">This Month</option>
          </select>
          <div className="pointer-events-none absolute right-3">
            <ChevronDown size={14} className="text-warm-400" />
          </div>
        </div>

        {/* Search Input */}
        <div className="relative ml-auto flex flex-1 min-w-[220px] max-w-[380px] items-center rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] px-4 py-2.5 transition-all focus-within:border-brass focus-within:ring-2 focus-within:ring-brass/30 shadow-sm">
          <Search size={16} className="text-brass shrink-0" />
          <input
            type="text"
            placeholder="Search events, ministries, pastors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent px-3 text-[0.875rem] text-ink placeholder:text-warm-400 focus:outline-none font-medium"
          />
          {isPending && <Loader2 size={15} className="animate-spin text-brass shrink-0" />}
        </div>
      </div>
    </div>
  );
}
