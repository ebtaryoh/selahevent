"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Search, MapPin, ListFilter, Loader2 } from "lucide-react";

export function EventSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");

  // Optional debounce for text input
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
    }, 400); // 400ms debounce

    return () => clearTimeout(timeout);
  }, [query, city, category, router, searchParams]);

  return (
    <div className="relative z-20 mx-auto -mt-8 max-w-4xl rounded-[18px] border border-[rgba(22,19,17,0.1)] bg-paper/95 p-4 shadow-xl shadow-[rgba(192,138,46,0.08)] backdrop-blur-xl transition-all hover:shadow-2xl">
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Search Query */}
        <div className="relative flex items-center rounded-[12px] bg-[rgba(22,19,17,0.03)] px-4 py-2 transition-colors focus-within:bg-white focus-within:ring-1 focus-within:ring-[var(--color-brass)]">
          <Search size={18} className="text-warm-400" />
          <input
            type="text"
            placeholder="Search events, ministries..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent px-3 py-1 text-[0.95rem] text-ink placeholder:text-warm-400 focus:outline-none"
          />
        </div>

        {/* City Filter */}
        <div className="relative flex items-center rounded-[12px] bg-[rgba(22,19,17,0.03)] px-4 py-2 transition-colors focus-within:bg-white focus-within:ring-1 focus-within:ring-[var(--color-brass)]">
          <MapPin size={18} className="text-warm-400" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full appearance-none bg-transparent px-3 py-1 text-[0.95rem] text-ink focus:outline-none"
          >
            <option value="">All Cities</option>
            <option value="Lagos">Lagos</option>
            <option value="Abuja">Abuja</option>
            <option value="Port Harcourt">Port Harcourt</option>
            <option value="Ibadan">Ibadan</option>
            <option value="Ogun">Ogun</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="relative flex items-center rounded-[12px] bg-[rgba(22,19,17,0.03)] px-4 py-2 transition-colors focus-within:bg-white focus-within:ring-1 focus-within:ring-[var(--color-brass)]">
          <ListFilter size={18} className="text-warm-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full appearance-none bg-transparent px-3 py-1 text-[0.95rem] text-ink focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="conference">Conference</option>
            <option value="retreat">Retreat</option>
            <option value="worship">Worship</option>
            <option value="seminar">Seminar</option>
          </select>
          
          {isPending && (
            <Loader2 size={16} className="absolute right-4 animate-spin text-[var(--color-brass)]" />
          )}
        </div>
      </div>
    </div>
  );
}
