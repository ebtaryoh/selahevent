"use client";

import { useState } from "react";
import { ArrowLeft, Check, Loader2, QrCode, Search, UserCheck } from "lucide-react";
import { searchRegistrations, checkInAttendee } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";

type RegistrationResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  ticketCode: string;
  status: string;
};

export function CommandCenter({ eventId }: { eventId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RegistrationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setMessage(null);
    try {
      const data = await searchRegistrations(eventId, query);
      setResults(data);
      if (data.length === 0) {
        setMessage({ type: "error", text: "No attendees found for this search." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Search failed. Please try again." });
    } finally {
      setSearching(false);
    }
  };

  const handleCheckIn = async (registrationId: string) => {
    setCheckingIn(registrationId);
    setMessage(null);
    try {
      const result = await checkInAttendee(registrationId, eventId);
      if (result.success) {
        setMessage({ type: "success", text: "Successfully checked in!" });
        setResults(results.filter(r => r.id !== registrationId));
        setQuery("");
      } else {
        setMessage({ type: "error", text: result.error || "Failed to check in." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred during check-in." });
    } finally {
      setCheckingIn(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Search Header */}
      <div className="rounded-[20px] bg-[var(--color-cypress)] border border-[rgba(232,211,166,0.15)] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="grain pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay" />
        
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(232,211,166,0.1)] border border-[rgba(232,211,166,0.2)] mb-6">
            <QrCode className="w-8 h-8 text-[var(--color-brass-light)]" />
          </div>
          <h2 className="font-display text-[2rem] md:text-[2.5rem] font-semibold tracking-tight text-[var(--color-parchment)] leading-none">
            Attendee Check-In
          </h2>
          <p className="mt-4 text-[1.05rem] text-[rgba(232,211,166,0.8)] max-w-lg mx-auto">
            Search by ticket code, name, or email to verify registration and check attendees into the event.
          </p>

          <form onSubmit={handleSearch} className="mt-8 relative max-w-xl mx-auto flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. TKT-X7B9..."
                className="w-full pl-12 pr-4 py-4 rounded-[12px] bg-white text-ink text-[1.05rem] font-medium outline-none focus:ring-2 focus:ring-[var(--color-brass)] shadow-inner transition-all placeholder:font-normal placeholder:text-warm-400"
              />
            </div>
            <button 
              type="submit" 
              disabled={searching || !query.trim()}
              className="bg-[var(--color-brass-deep)] text-white px-6 rounded-[12px] font-semibold text-[1.05rem] hover:bg-[var(--color-brass)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
            </button>
          </form>
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-[12px] flex items-center gap-3 border ${
              message.type === 'success' 
                ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]' 
                : 'bg-[#FFEBEE] border-[#EF9A9A] text-[#C62828]'
            }`}
          >
            {message.type === 'success' ? <Check className="w-5 h-5" /> : null}
            <span className="font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-ink text-[1.1rem]">Search Results</h3>
          <div className="grid gap-3">
            {results.map((attendee) => (
              <div 
                key={attendee.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[16px] bg-paper border border-[rgba(22,19,17,0.1)] shadow-sm gap-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-[1.1rem] font-semibold text-ink">
                      {attendee.firstName} {attendee.lastName}
                    </h4>
                    <span className="pill pill-live">
                      {attendee.status}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                    <span className="text-[0.9rem] text-warm-500 font-medium font-mono">
                      {attendee.ticketCode}
                    </span>
                    <span className="hidden sm:inline text-warm-300">•</span>
                    <span className="text-[0.9rem] text-warm-500">
                      {attendee.email}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleCheckIn(attendee.id)}
                  disabled={checkingIn === attendee.id}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-cypress)] hover:bg-[var(--color-ink)] text-white rounded-[10px] font-semibold text-[0.95rem] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {checkingIn === attendee.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  {checkingIn === attendee.id ? "Checking in..." : "Check In"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
